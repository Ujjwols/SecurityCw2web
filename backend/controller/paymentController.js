const asyncHandler = require("../utils/asyncHandler");
const Payment = require("../model/paymentModel");
const EventRegistration = require("../model/eventRegistrationModel");
const Event = require("../model/eventModel");
const User = require("../model/userModel");
const khaltiPayment = require("../utils/khaltiPayment");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { body, validationResult } = require("express-validator");

// Initialize payment for event registration
const initializePaymentController = asyncHandler(async (req, res) => {
  // Validation
  await Promise.all([
    body("eventId")
      .isMongoId()
      .withMessage("Invalid event ID")
      .run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map((err) => err.msg).join("; "));
  }

  const { eventId } = req.body;
  const userId = req.user._id;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Use event's actual price instead of the amount sent from frontend
  const actualAmount = event.price || 0;
  const amountInPaisa = actualAmount * 100; // Convert to paisa for Khalti

  // Check if user is already registered for this event
  const existingRegistration = await EventRegistration.findOne({
    user: userId,
    event: eventId,
  });

  if (existingRegistration) {
    throw new ApiError(400, "You are already registered for this event");
  }

  // Check if there's already a pending payment for this user and event
  const existingPayment = await Payment.findOne({
    user: userId,
    event: eventId,
    status: "pending",
  });

  if (existingPayment) {
    throw new ApiError(400, "You already have a pending payment for this event");
  }

  // Generate a unique purchase order ID
  const purchaseOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Prepare payment data for Khalti
  const paymentData = {
    amount: amountInPaisa,
    currency: "NPR",
    returnUrl: `${process.env.USER_CORS_ORIGIN}/payment/success`,
    websiteUrl: process.env.USER_CORS_ORIGIN,
    purchaseOrderId: purchaseOrderId,
    purchaseOrderName: `Event Registration - ${event.title}`,
    customerInfo: {
      name: req.user.username,
      email: req.user.email,
    },
    amountBreakdown: [
      { label: "Subtotal", amount: amountInPaisa },
      { label: "Tax", amount: 0 },
      { label: "Shipping", amount: 0 },
      { label: "Discount", amount: 0 },
    ],
    productDetails: [
      {
        identity: eventId,
        name: event.title,
        total_price: amountInPaisa,
        quantity: 1,
        unit_price: amountInPaisa,
      },
    ],
  };

  // Initialize payment with Khalti
  console.log("Initializing payment with Khalti for purchaseOrderId:", purchaseOrderId);
  const khaltiResponse = await khaltiPayment.initializePayment(paymentData);

  if (!khaltiResponse.success) {
    console.error("Khalti payment initialization failed:", khaltiResponse.error);
    if (khaltiResponse.error.includes("504") || khaltiResponse.error.includes("timeout")) {
      throw new ApiError(503, "Payment service is temporarily unavailable. Please try again in a few moments.");
    }
    if (khaltiResponse.error.includes("validation_error") || khaltiResponse.error.includes("400")) {
      throw new ApiError(400, "Invalid payment request. Please check your payment details and try again.");
    }
    throw new ApiError(500, `Payment initialization failed: ${khaltiResponse.error}`);
  }

  console.log("Khalti initialization response:", khaltiResponse.data);

  // Update returnUrl with actual pidx
  paymentData.returnUrl = `${process.env.USER_CORS_ORIGIN}/payment/success?pidx=${khaltiResponse.data.pidx}`;

  // Create payment record in database
  const payment = await Payment.create({
    user: userId,
    event: eventId,
    amount: actualAmount,
    currency: "NPR",
    khaltiTransactionId: khaltiResponse.data.pidx,
    khaltiPaymentUrl: khaltiResponse.data.paymentUrl,
    status: "pending",
    paymentMethod: "khalti",
    metadata: {
      khaltiToken: khaltiResponse.data.token || null,
      eventTitle: event.title,
      purchaseOrderId: purchaseOrderId,
    },
  });

  // Check payment status immediately
  console.log(`Checking initial payment status for pidx: ${khaltiResponse.data.pidx}`);
  const khaltiStatus = await khaltiPayment.getPaymentStatus(khaltiResponse.data.pidx);
  if (khaltiStatus.success && khaltiStatus.data.status === "Completed") {
    payment.status = "completed";
    payment.completedAt = new Date();
    payment.metadata.khaltiResponse = khaltiStatus.data;
    await payment.save();

    // Create event registration
    const registration = await EventRegistration.create({
      user: userId,
      event: payment.event,
      payment: payment._id,
      status: "registered",
    });

    // Update user's registeredEvents array
    const user = await User.findById(userId);
    if (user) {
      user.registeredEvents.push({
        event: payment.event,
        registrationDate: new Date(),
        status: "registered",
        payment: payment._id,
      });
      await user.save();
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {
      paymentId: payment._id,
      paymentUrl: khaltiResponse.data.paymentUrl,
      transactionId: khaltiResponse.data.pidx,
      purchaseOrderId: purchaseOrderId,
      amount: actualAmount,
      status: payment.status,
    }, "Payment initialized successfully")
  );
});

// Verify payment and complete registration
const verifyPaymentController = asyncHandler(async (req, res) => {
  // Validation
  await Promise.all([
    body("token")
      .notEmpty()
      .withMessage("Payment token is required")
      .run(req),
    body("transactionId")
      .notEmpty()
      .withMessage("Transaction ID is required")
      .run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map((err) => err.msg).join("; "));
  }

  const { token, transactionId } = req.body;
  const userId = req.user._id;

  // Find the payment record
  console.log("Looking for payment with transactionId:", transactionId, "and userId:", userId);
  
  let payment = await Payment.findOne({
    khaltiTransactionId: transactionId,
    user: userId,
  });

  if (!payment) {
    console.log("Payment not found. Available payments for user:", await Payment.find({ user: userId }).select('khaltiTransactionId metadata.purchaseOrderId'));
    throw new ApiError(404, "Payment not found");
  }

  if (payment.status === "completed") {
    throw new ApiError(400, "Payment has already been completed");
  }

  // Verify payment with Khalti
  console.log("Verifying payment with token:", token);
  const verificationResponse = await khaltiPayment.verifyPayment(token);

  if (!verificationResponse.success) {
    console.error("Khalti verification failed:", verificationResponse.error);
    throw new ApiError(500, `Payment verification failed: ${verificationResponse.error}`);
  }

  const khaltiData = verificationResponse.data;
  console.log("Khalti verification response:", khaltiData);

  // Check if payment was successful
  if (khaltiData.status !== "Completed") {
    payment.status = "failed";
    payment.metadata.verificationError = khaltiData.status;
    await payment.save();

    throw new ApiError(400, `Payment failed with status: ${khaltiData.status}`);
  }

  // Verify amount matches
  console.log("Amount verification - Khalti amount:", khaltiData.amount, "Payment amount:", payment.amount * 100);
  if (khaltiData.amount !== payment.amount * 100) {
    throw new ApiError(400, "Payment amount mismatch");
  }

  // Update payment status to completed
  payment.status = "completed";
  payment.completedAt = new Date();
  payment.metadata.khaltiResponse = khaltiData;
  await payment.save();

  // Create event registration
  const registration = await EventRegistration.create({
    user: userId,
    event: payment.event,
    payment: payment._id,
    status: "registered",
  });

  // Update user's registeredEvents array
  const user = await User.findById(userId);
  if (user) {
    user.registeredEvents.push({
      event: payment.event,
      registrationDate: new Date(),
      status: "registered",
      payment: payment._id,
    });
    await user.save();
  }

  return res.status(200).json(
    new ApiResponse(200, {
      registrationId: registration._id,
      paymentId: payment._id,
      status: "completed",
      eventId: payment.event,
    }, "Payment verified and registration completed successfully")
  );
});

// Get payment status
const getPaymentStatusController = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user._id;

  let payment = await Payment.findOne({
    khaltiTransactionId: transactionId,
    user: userId,
  }).populate("event", "title date time location");

  if (!payment) {
    console.log(`Payment not found for transactionId: ${transactionId}, userId: ${userId}`);
    console.log("Available payments for user:", await Payment.find({ user: userId }).select('khaltiTransactionId metadata.purchaseOrderId'));
    throw new ApiError(404, "Payment not found");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      payment,
    }, "Payment status retrieved successfully")
  );
});

// Get user's event registrations
const getUserRegistrationsController = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Get user with populated registeredEvents
  const user = await User.findById(userId)
    .populate({
      path: "registeredEvents.event",
      select: "title date time location description files price",
    })
    .populate({
      path: "registeredEvents.payment",
      select: "amount status khaltiTransactionId",
    });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Sort registrations by registration date (newest first)
  const sortedRegistrations = user.registeredEvents.sort(
    (a, b) => new Date(b.registrationDate) - new Date(a.registrationDate)
  );

  // Apply pagination
  const paginatedRegistrations = sortedRegistrations.slice(skip, skip + limitNum);

  // Transform data to match expected format
  const registrations = paginatedRegistrations.map(reg => ({
    _id: reg._id,
    status: reg.status,
    registrationDate: reg.registrationDate,
    event: reg.event,
    payment: reg.payment,
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      registrations,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(user.registeredEvents.length / limitNum),
        totalRegistrations: user.registeredEvents.length,
        limit: limitNum,
      },
    }, "User registrations retrieved successfully")
  );
});

// Cancel event registration
const cancelRegistrationController = asyncHandler(async (req, res) => {
  const { registrationId } = req.params;
  const userId = req.user._id;

  const registration = await EventRegistration.findOne({
    _id: registrationId,
    user: userId,
  }).populate("payment");

  if (!registration) {
    throw new ApiError(404, "Registration not found");
  }

  if (registration.status === "cancelled") {
    throw new ApiError(400, "Registration is already cancelled");
  }

  // Update registration status
  registration.status = "cancelled";
  await registration.save();

  // Update user's registeredEvents array
  const user = await User.findById(userId);
  if (user) {
    const eventRegistration = user.registeredEvents.find(
      reg => reg.event.toString() === registration.event.toString()
    );
    if (eventRegistration) {
      eventRegistration.status = "cancelled";
      await user.save();
    }
  }

  // Update payment status if it's still pending
  if (registration.payment && registration.payment.status === "pending") {
    registration.payment.status = "cancelled";
    await registration.payment.save();
  }

  return res.status(200).json(
    new ApiResponse(200, {
      registration,
    }, "Registration cancelled successfully")
  );
});

// Webhook for Khalti payment updates (for production)
const khaltiWebhookController = asyncHandler(async (req, res) => {
  const { signature } = req.headers;
  const payload = req.body;

  console.log("Khalti webhook received:", payload);

  // Verify webhook signature in production
  if (process.env.NODE_ENV === "production") {
    if (!khaltiPayment.verifyWebhookSignature(payload, signature)) {
      throw new ApiError(401, "Invalid webhook signature");
    }
  }

  const { token, type, amount, pidx } = payload;

  if (type !== "payment") {
    return res.status(200).json({ message: "Webhook received" });
  }

  // Find payment by Khalti pidx
  let payment = await Payment.findOne({ khaltiTransactionId: pidx });

  if (!payment) {
    console.error(`Payment not found for pidx: ${pidx}`);
    return res.status(404).json({ message: "Payment not found" });
  }

  console.log(`Processing webhook for payment: ${payment._id}, status: ${payload.status}`);

  // Update payment status based on Khalti response
  if (payload.status === "Completed") {
    payment.status = "completed";
    payment.completedAt = new Date();
    payment.metadata.khaltiWebhook = payload;
    await payment.save();

    // Create event registration if it doesn't exist
    const existingRegistration = await EventRegistration.findOne({
      user: payment.user,
      event: payment.event,
    });

    if (!existingRegistration) {
      const registration = await EventRegistration.create({
        user: payment.user,
        event: payment.event,
        payment: payment._id,
        status: "registered",
      });

      // Update user's registeredEvents array
      const user = await User.findById(payment.user);
      if (user) {
        user.registeredEvents.push({
          event: payment.event,
          registrationDate: new Date(),
          status: "registered",
          payment: payment._id,
        });
        await user.save();
      }

      console.log(`Registration created: ${registration._id}`);
    } else {
      console.log(`Registration already exists: ${existingRegistration._id}`);
    }
  } else {
    payment.status = "failed";
    payment.metadata.khaltiWebhook = payload;
    await payment.save();
    console.log(`Payment marked as failed: ${payment._id}`);
  }

  return res.status(200).json({ message: "Webhook processed successfully" });
});

// Get payment by purchase order ID
const getPaymentByOrderIdController = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  const payment = await Payment.findOne({
    "metadata.purchaseOrderId": orderId,
    user: userId,
  }).populate("event", "title date time location");

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      payment,
    }, "Payment retrieved successfully")
  );
});

// Check payment status directly with Khalti
const checkPaymentStatusController = asyncHandler(async (req, res) => {
  const { pidx } = req.body;
  const userId = req.user._id;

  if (!pidx) {
    throw new ApiError(400, "pidx is required");
  }

  console.log(`Received status check request for pidx: ${pidx}, userId: ${userId}`);

  try {
    // Find payment by Khalti pidx
    let payment = await Payment.findOne({
      khaltiTransactionId: pidx,
      user: userId,
    }).populate("event", "title date time location");

    if (!payment) {
      console.log(`Payment not found for pidx: ${pidx}, userId: ${userId}`);
      console.log("Available payments for user:", await Payment.find({ user: userId }).select('khaltiTransactionId metadata.purchaseOrderId'));
      throw new ApiError(404, "Payment not found");
    }

    // If payment is already completed, return it
    if (payment.status === "completed") {
      console.log(`Payment already completed for pidx: ${pidx}`);
      return res.status(200).json(
        new ApiResponse(200, {
          payment,
        }, "Payment is already completed")
      );
    }

    // Check payment status with Khalti
    console.log(`Checking payment status with Khalti for pidx: ${pidx}`);
    const khaltiResponse = await khaltiPayment.getPaymentStatus(pidx);

    if (khaltiResponse.success) {
      const khaltiData = khaltiResponse.data;
      console.log("Khalti payment status response:", khaltiData);

      if (khaltiData.status === "Completed") {
        // Update payment status to completed
        payment.status = "completed";
        payment.completedAt = new Date();
        payment.metadata.khaltiResponse = khaltiData;
        await payment.save();

        // Create event registration if it doesn't exist
        const existingRegistration = await EventRegistration.findOne({
          user: payment.user,
          event: payment.event,
        });

        if (!existingRegistration) {
          const registration = await EventRegistration.create({
            user: payment.user,
            event: payment.event,
            payment: payment._id,
            status: "registered",
          });

          // Update user's registeredEvents array
          const user = await User.findById(payment.user);
          if (user) {
            user.registeredEvents.push({
              event: payment.event,
              registrationDate: new Date(),
              status: "registered",
              payment: payment._id,
            });
            await user.save();
          }

          console.log(`Registration created: ${registration._id}`);
        }

        return res.status(200).json(
          new ApiResponse(200, {
            payment,
          }, "Payment completed successfully")
        );
      } else {
        // Payment is still pending or failed
        payment.status = khaltiData.status === "Pending" ? "pending" : "failed";
        payment.metadata.khaltiResponse = khaltiData;
        await payment.save();

        return res.status(200).json(
          new ApiResponse(200, {
            payment,
          }, `Payment status: ${khaltiData.status}`)
        );
      }
    } else {
      console.error("Khalti payment status error:", khaltiResponse.error);
      throw new ApiError(500, `Failed to get payment status from Khalti: ${khaltiResponse.error}`);
    }
  } catch (error) {
    console.error("Payment status check error:", {
      message: error.message,
      stack: error.stack
    });
    if (error.message.includes("404")) {
      throw new ApiError(400, "Invalid payment ID or transaction not found");
    }
    throw new ApiError(500, `Payment status check failed: ${error.message}`);
  }
});

// Manually trigger webhook processing for testing
const triggerWebhookController = asyncHandler(async (req, res) => {
  const { pidx } = req.body;
  
  if (!pidx) {
    throw new ApiError(400, "pidx is required");
  }

  try {
    // Find payment by Khalti pidx
    let payment = await Payment.findOne({ khaltiTransactionId: pidx });

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    // Simulate webhook processing
    console.log(`Manually processing webhook for payment: ${payment._id}`);
    
    // Check payment status with Khalti
    const khaltiResponse = await khaltiPayment.getPaymentStatus(pidx);
    
    if (khaltiResponse.success) {
      const khaltiData = khaltiResponse.data;
      
      if (khaltiData.status === "Completed") {
        // Update payment status
        payment.status = "completed";
        payment.completedAt = new Date();
        payment.metadata.khaltiResponse = khaltiData;
        await payment.save();

        // Create event registration if it doesn't exist
        const existingRegistration = await EventRegistration.findOne({
          user: payment.user,
          event: payment.event,
        });

        if (!existingRegistration) {
          const registration = await EventRegistration.create({
            user: payment.user,
            event: payment.event,
            payment: payment._id,
            status: "registered",
          });

          // Update user's registeredEvents array
          const user = await User.findById(payment.user);
          if (user) {
            user.registeredEvents.push({
              event: payment.event,
              registrationDate: new Date(),
              status: "registered",
              payment: payment._id,
            });
            await user.save();
          }

          console.log(`Registration created: ${registration._id}`);
        }

        return res.status(200).json(
          new ApiResponse(200, {
            payment,
            message: "Payment processed successfully"
          }, "Webhook triggered successfully")
        );
      } else {
        payment.status = "failed";
        payment.metadata.khaltiResponse = khaltiData;
        await payment.save();
        
        return res.status(200).json(
          new ApiResponse(200, {
            payment,
            message: `Payment failed with status: ${khaltiData.status}`
          }, "Payment status updated")
        );
      }
    } else {
      throw new ApiError(500, `Failed to get payment status from Khalti: ${khaltiResponse.error}`);
    }
  } catch (error) {
    console.error("Manual webhook trigger error:", {
      message: error.message,
      stack: error.stack
    });
    throw new ApiError(500, `Webhook trigger failed: ${error.message}`);
  }
});

// Test Khalti connectivity
const testKhaltiConnectionController = asyncHandler(async (req, res) => {
  try {
    console.log("Testing Khalti connectivity...");
    
    // Simple test request to Khalti API
    const testResponse = await khaltiPayment.getPaymentStatus("test-pidx");
    
    return res.status(200).json(
      new ApiResponse(200, {
        khaltiReachable: true,
        message: "Khalti API is reachable"
      }, "Khalti connectivity test successful")
    );
  } catch (error) {
    console.error("Khalti connectivity test failed:", {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(503).json(
      new ApiResponse(503, {
        khaltiReachable: false,
        error: error.message
      }, "Khalti API is not reachable")
    );
  }
});

module.exports = {
  initializePaymentController,
  verifyPaymentController,
  getPaymentStatusController,
  getUserRegistrationsController,
  cancelRegistrationController,
  khaltiWebhookController,
  getPaymentByOrderIdController,
  checkPaymentStatusController,
  triggerWebhookController,
  testKhaltiConnectionController,
};
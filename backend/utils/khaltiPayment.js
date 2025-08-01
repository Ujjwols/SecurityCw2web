const axios = require("axios");
const crypto = require("crypto");

class KhaltiPayment {
  constructor() {
    this.secretKey = process.env.KHALTI_SECRET_KEY;
    this.publicKey = process.env.KHALTI_PUBLIC_KEY;
    this.baseUrl = process.env.NODE_ENV === "production" 
      ? "https://khalti.com/api/v2" 
      : "https://a.khalti.com/api/v2";
    
    // Validate environment variables
    if (!this.secretKey || !this.publicKey) {
      console.error("Khalti configuration error: Missing KHALTI_SECRET_KEY or KHALTI_PUBLIC_KEY");
      throw new Error("Khalti API keys are not configured. Please check your environment variables.");
    }
  }

  // Generate a unique transaction ID
  generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize payment with Khalti
  async initializePayment(paymentData) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const {
          amount,
          currency = "NPR",
          returnUrl,
          websiteUrl,
          purchaseOrderId,
          purchaseOrderName,
          customerInfo,
          amountBreakdown,
          productDetails
        } = paymentData;

        // Validate required fields
        if (!purchaseOrderId) {
          throw new Error("purchase_order_id is required");
        }
        
        if (!purchaseOrderName) {
          throw new Error("purchase_order_name is required");
        }
        
        if (!customerInfo || !customerInfo.name || !customerInfo.email) {
          throw new Error("customer_info with name and email is required");
        }

        const payload = {
          public_key: this.publicKey,
          amount: amount,
          currency: currency,
          return_url: returnUrl,
          website_url: websiteUrl,
          purchase_order_id: purchaseOrderId,
          purchase_order_name: purchaseOrderName,
          customer_info: customerInfo,
          amount_breakdown: amountBreakdown,
          product_details: productDetails
        };

        console.log(`Khalti initialization attempt ${attempt}/${maxRetries}:`, {
          purchaseOrderId,
          amount,
          returnUrl
        });
        
        const response = await axios.post(
          `${this.baseUrl}/epayment/initiate/`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Key ${this.secretKey}`
            },
            timeout: 120000 // Increased to 120 seconds
          }
        );

        console.log("Khalti initialization response:", response.data);

        return {
          success: true,
          data: {
            paymentUrl: response.data.payment_url,
            pidx: response.data.pidx,
            token: response.data.token || null
          }
        };
      } catch (error) {
        lastError = error;
        console.error(`Khalti payment initialization error (attempt ${attempt}/${maxRetries}):`, {
          message: error.message,
          response: error.response?.data,
          code: error.code
        });
        
        // Retry on timeout or network errors
        if (attempt < maxRetries && (error.code === 'ECONNABORTED' || error.response?.status === 504)) {
          console.log(`Retrying Khalti payment initialization (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 5000 * attempt)); // Increased backoff
          continue;
        }
        
        // Don't retry on validation errors (400)
        if (error.response?.status === 400) {
          console.log("Validation error - not retrying");
          break;
        }
        
        break;
      }
    }

    // Extract error details
    let errorMessage = "Payment initialization failed after multiple attempts";
    
    if (lastError?.response?.data) {
      const khaltiError = lastError.response.data;
      if (khaltiError.error_key === 'validation_error' && khaltiError.purchase_order_id) {
        errorMessage = `Validation error: ${khaltiError.purchase_order_id.join(', ')}`;
      } else if (khaltiError.detail) {
        errorMessage = khaltiError.detail;
      } else if (typeof khaltiError === 'string') {
        errorMessage = khaltiError;
      }
    } else if (lastError?.message) {
      errorMessage = lastError.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }

  // Verify payment with Khalti
  async verifyPayment(token) {
    try {
      if (!token) {
        throw new Error("Token is required for payment verification");
      }

      const payload = {
        public_key: this.publicKey,
        token: token
      };

      console.log("Khalti verification payload:", payload);
      
      const response = await axios.post(
        `${this.baseUrl}/epayment/lookup/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Key ${this.secretKey}`
          },
          timeout: 120000 // Increased to 120 seconds
        }
      );

      console.log("Khalti verification response:", response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error("Khalti payment verification error:", {
        message: error.message,
        response: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  // Verify webhook signature (for production)
  verifyWebhookSignature(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.secretKey)
        .update(JSON.stringify(payload))
        .digest("hex");

      return signature === expectedSignature;
    } catch (error) {
      console.error("Webhook signature verification error:", error);
      return false;
    }
  }

  // Get payment status
  async getPaymentStatus(pidx) {
    try {
      if (!pidx) {
        throw new Error("pidx is required for payment status check");
      }

      const payload = { pidx };

      console.log("Khalti status check payload:", payload);
      
      const response = await axios.post(
        `${this.baseUrl}/epayment/lookup/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Key ${this.secretKey}`
          },
          timeout: 120000 // Increased to 120 seconds
        }
      );

      console.log("Khalti status check response:", response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error("Khalti payment status check error:", {
        message: error.message,
        response: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }
}

module.exports = new KhaltiPayment();
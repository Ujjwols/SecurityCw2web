import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api, { initializeAPI } from "@/api/api";
import { AxiosError } from "axios";
import useAuth from "@/hooks/useAuth";

interface PaymentData {
  paymentId: string;
  registrationId: string;
  eventId: string;
  amount: number;
  status: string;
  event?: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkPaymentStatus = async (pidx: string) => {
    console.log("Checking payment status directly for pidx:", pidx);
    try {
      await initializeAPI(); // Ensure API is initialized with auth token
      const response = await api.post("/payment/check-status", { pidx });

      if (response.data.success) {
        const payment = response.data.data.payment;
        if (payment && payment.status === "completed") {
          setPaymentData({
            paymentId: payment._id,
            registrationId: payment._id, // Adjust if registrationId is separate
            eventId: payment.event._id,
            amount: payment.amount,
            status: "completed",
            event: payment.event,
          });
          toast({
            title: "Payment Successful!",
            description: "Your event registration has been completed successfully.",
          });
          setLoading(false);
          return true;
        } else {
          setError("Payment is still processing. Please check your payment status in your profile.");
          setLoading(false);
          return false;
        }
      }
    } catch (error: unknown) {
      console.error("Payment status check error:", error);
      let errorMessage = "Unable to verify payment status. Please check your payment status in your profile.";
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const verifyPayment = async () => {
    // Retrieve stored payment data from sessionStorage
    const storedPaymentData = sessionStorage.getItem("paymentData");
    if (!storedPaymentData) {
      setError("No payment data found. Please initiate payment again.");
      setLoading(false);
      return;
    }

    let pidx: string;
    try {
      const { pidx: storedPidx } = JSON.parse(storedPaymentData);
      pidx = storedPidx;
    } catch (error) {
      console.error("Error parsing stored payment data:", error);
      setError("Invalid payment data. Please initiate payment again.");
      setLoading(false);
      return;
    }

    if (!pidx) {
      setError("Missing payment reference. Please initiate payment again.");
      setLoading(false);
      return;
    }

    try {
      const success = await checkPaymentStatus(pidx);
      if (!success && retryCount < 2) {
        setRetryCount(prev => prev + 1);
        toast({
          title: "Retrying...",
          description: `Attempt ${retryCount + 2} of 3`,
        });
        setTimeout(() => {
          setLoading(true);
          setError(null);
          verifyPayment();
        }, 2000);
        return;
      }
    } finally {
      // Clear stored payment data after processing
      sessionStorage.removeItem("paymentData");
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setError("Please log in to verify your payment");
      setLoading(false);
      navigate("/login");
      return;
    }

    console.log("All URL parameters:", Object.fromEntries(searchParams.entries()));
    verifyPayment();
  }, [searchParams, toast, currentUser, authLoading, retryCount, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Payment Verification Failed
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-3">
            {error === "Please log in to verify your payment" ? (
              <Button className="w-full" onClick={() => navigate("/login")}>
                Go to Login
              </Button>
            ) : (
              <>
                <Link to="/events">
                  <Button className="w-full">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Back to Events
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" className="w-full">
                    View My Registrations
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Payment Successful!
            </CardTitle>
            <p className="text-muted-foreground">
              Your event registration has been completed successfully.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentData?.event && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg">{paymentData.event.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{paymentData.event.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{paymentData.event.location}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium">NPR {paymentData?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-green-600">Completed</span>
              </div>
              <div className="flex justify-between">
                <span>Registration ID:</span>
                <span className="font-mono text-xs">{paymentData?.registrationId}</span>
              </div>
            </div>
            <div className="space-y-3">
              <Link to="/events">
                <Button className="w-full">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Browse More Events
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" className="w-full">
                  View My Registrations
                </Button>
              </Link>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              A confirmation email has been sent to your registered email address.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
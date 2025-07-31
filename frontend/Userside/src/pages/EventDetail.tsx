import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, Tag, Mail, ArrowLeft, Share2, Heart, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import api, { initializeAPI } from "@/api/api";
import { AxiosError } from "axios";
import useAuth from "@/hooks/useAuth";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price?: number;
  files?: {
    url: string;
    type: string;
  }[];
  createdAt: string;
}

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [eventPrice, setEventPrice] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      try {
        await initializeAPI();
        const response = await api.get<{ success: boolean; data: Event; message: string }>(
          `/event/get-event/${id}`
        );
        if (response.data.success) {
          setEvent(response.data.data);
          setEventPrice(response.data.data.price || 0);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof AxiosError
          ? error.response?.data?.message || 'Failed to fetch event'
          : 'An unexpected error occurred';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, toast]);

  const handleRegister = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to register for this event.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!user || !event) return;

    setPaymentLoading(true);
    try {
      await initializeAPI();
      const response = await api.post('/payment/initiate', {
        eventId: event._id,
        amount: 0, // Backend determines amount
      });

      if (response.data.success) {
        const { paymentId, paymentUrl, transactionId, purchaseOrderId, status } = response.data.data;
        console.log("Storing payment data in sessionStorage:", {
          pidx: transactionId,
          paymentId,
          purchaseOrderId,
          status
        });
        sessionStorage.setItem("paymentData", JSON.stringify({
          pidx: transactionId, // Khalti pidx
          paymentId,
          purchaseOrderId,
          amount: response.data.data.amount
        }));
        console.log("sessionStorage after set:", sessionStorage.getItem("paymentData"));
        
        // Redirect to Khalti payment page
        window.location.href = paymentUrl;
      }
    } catch (error: unknown) {
      console.error("Payment initialization error:", error);
      
      let errorMessage = "Payment initialization failed. Please try again.";
      
      if (error instanceof AxiosError) {
        if (error.response?.status === 503) {
          errorMessage = "Payment service is temporarily unavailable. Please try again in a few moments.";
        } else if (error.response?.status === 500) {
          errorMessage = "Payment service error. Please try again later.";
        } else if (error.response?.status === 400) {
          errorMessage = error.response?.data?.message || "Invalid payment request.";
        } else if (!error.response) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.response?.data?.message || "Payment initialization failed";
        }
      }
      
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Event link has been copied to your clipboard.",
    });
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from Favorites" : "Added to Favorites",
      description: isFavorited 
        ? "Event removed from your favorites."
        : "Event added to your favorites.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist.</p>
          <Link to="/events">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const eventImage = event.files && event.files.length > 0 ? event.files[0].url : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <div className="h-96 overflow-hidden">
          {eventImage ? (
            <img
              src={eventImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">{event.title}</h2>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <div className="text-white">
              <Link to="/events" className="inline-flex items-center text-white/80 hover:text-white mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Link>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  Event
                </Badge>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {event.description}
                  </p>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Location</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-semibold">{event.location}</p>
                  </div>
                  <div className="mt-6 h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Map Integration would go here</p>
                  </div>
                </CardContent>
              </Card>

              {/* Files */}
              {event.files && event.files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Event Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={file.url} 
                                alt={`Event file ${index + 1}`}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <Tag className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.url.split('/').pop()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.type}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      NPR {event?.price || 0}
                    </div>
                    <p className="text-muted-foreground">per person</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleRegister}
                    variant={isRegistered ? "outline" : "default"}
                    size="lg" 
                    className="w-full"
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isRegistered ? (
                      "Cancel Registration"
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Register Now
                      </>
                    )}
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleFavorite}
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                      {isFavorited ? "Favorited" : "Favorite"}
                    </Button>
                    <Button 
                      onClick={handleShare}
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{event.date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">{event.time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{event.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium capitalize">General</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Complete Registration
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Register for {event?.title}
              </h3>
              <p className="text-muted-foreground mb-4">
                Complete your registration by making a payment of NPR {event?.price || 0}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span>Event Price:</span>
                <span className="font-medium">NPR {event?.price || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">NPR 0</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>NPR {event?.price || 0}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handlePayment}
                className="w-full"
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay with Khalti
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                className="w-full"
                disabled={paymentLoading}
              >
                Cancel
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              You will be redirected to Khalti's secure payment gateway to complete your transaction.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetail;
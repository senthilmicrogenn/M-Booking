import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Wallet, Shield, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function PaymentInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-[#006699] hover:text-gray-800 hover:bg-gray-50">
                  ← Back to Portal
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-800">Payment Methods & Information</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Payment Methods Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <CreditCard className="w-6 h-6" />
                Available Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Credit/Debit Cards */}
                <div className="flex flex-col items-center text-center p-6 border rounded">
                  <CreditCard className="w-12 h-12 text-primary-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Credit & Debit Cards</h3>
                  <p className="text-gray-600 mb-4">Visa, Mastercard, American Express, RuPay</p>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Instant Payment
                  </Badge>
                </div>

                {/* Digital Wallets */}
                <div className="flex flex-col items-center text-center p-6 border rounded">
                  <Smartphone className="w-12 h-12 text-primary-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Digital Wallets</h3>
                  <p className="text-gray-600 mb-4">UPI, Paytm, PhonePe, Google Pay</p>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Quick & Secure
                  </Badge>
                </div>

                {/* Net Banking */}
                <div className="flex flex-col items-center text-center p-6 border rounded">
                  <Wallet className="w-12 h-12 text-primary-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Net Banking</h3>
                  <p className="text-gray-600 mb-4">All major Indian banks supported</p>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Bank Transfer
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Process Flow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">How Payment Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary-600 font-bold">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Select Services</h4>
                  <p className="text-sm text-gray-600">Choose your hotel, flights, or other travel services</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary-600 font-bold">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Review Booking</h4>
                  <p className="text-sm text-gray-600">Confirm dates, guests, and total amount</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary-600 font-bold">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Make Payment</h4>
                  <p className="text-sm text-gray-600">Choose payment method and complete transaction</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary-600 font-bold">4</span>
                  </div>
                  <h4 className="font-semibold mb-2">Confirmation</h4>
                  <p className="text-sm text-gray-600">Get instant booking confirmation and receipts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Shield className="w-6 h-6" />
                Security & Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Payment Security</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      SSL encryption for all transactions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      PCI DSS compliant payment processing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Two-factor authentication support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Fraud detection and prevention
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Booking Protection</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Instant booking confirmation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Flexible cancellation policies
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      24/7 customer support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Money-back guarantee
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Payment Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Advance Payment Required</h4>
                      <p className="text-sm text-yellow-700">
                        For hotel bookings, 100% payment is required at the time of booking to guarantee your reservation.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Cancellation Policy</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Free cancellation up to 24 hours before check-in</li>
                      <li>• 50% refund for cancellations 12-24 hours prior</li>
                      <li>• No refund for same-day cancellations</li>
                      <li>• Conference bookings: 48-hour notice required</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Refund Process</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Refunds processed within 5-7 business days</li>
                      <li>• Amount credited to original payment method</li>
                      <li>• Email notification upon refund initiation</li>
                      <li>• Customer support for refund inquiries</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Need Help with Payments?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Our customer support team is available 24/7 to assist you with any payment-related questions or issues.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-[#006699] hover:bg-[#002a66]">
                    Contact Support
                  </Button>
                  <Button variant="outline">
                    View FAQ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
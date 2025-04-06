"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Wrench } from "lucide-react";

const formSchema = z.object({
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Invalid mobile number"),
  otp: z.string().optional(),
});

export default function WorkerSignInPage() {
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [previousMobileNumber, setPreviousMobileNumber] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobileNumber: "",
      otp: "",
    },
  });

  // Watch for mobile number changes
  const mobileNumber = form.watch("mobileNumber");

  // Reset OTP state when mobile number changes
  useEffect(() => {
    if (mobileNumber !== previousMobileNumber) {
      setPreviousMobileNumber(mobileNumber);
      setOtp("");
      setShowOtpInput(false);
      setIsVerifying(false);
      form.setValue("otp", "");
    }
  }, [mobileNumber, previousMobileNumber, form]);

  const sendOTP = async (mobileNumber: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/worker-auth/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobileNumber
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setShowOtpInput(true);
      // Display OTP in development mode
      toast({
        title: "OTP Sent",
        description: `Your OTP is: ${data.otp} (Development mode only)`,
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
      setShowOtpInput(false);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (mobileNumber: string, otp: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch("http://localhost:5000/api/worker-auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobileNumber,
          otp
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      // Store worker data in localStorage
      localStorage.setItem("worker", JSON.stringify(data.worker));
      localStorage.setItem("token", data.token);

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Redirect to worker dashboard
      router.push("/dashboard/worker");
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await sendOTP(values.mobileNumber);
  };

  const handleVerifyOTP = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!mobileNumber || !otp) return;
    await verifyOTP(mobileNumber, otp);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <main className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Worker Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your mobile number"
                            {...field}
                            disabled={isLoading || isVerifying}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!showOtpInput && (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  )}
                </form>
              </Form>

              {showOtpInput && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>OTP</Label>
                    <Input
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      disabled={isVerifying}
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    disabled={isVerifying || !otp}
                    onClick={handleVerifyOTP}
                  >
                    {isVerifying ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 
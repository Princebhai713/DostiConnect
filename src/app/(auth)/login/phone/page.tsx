'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/app-logo';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import Link from 'next/link';

declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}

export default function PhoneLoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (auth && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  }, [auth]);

  const handleSendOtp = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      toast({ title: 'OTP Sent!', description: 'An OTP has been sent to your phone number.' });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to send OTP',
        description: error.message,
      });
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if(!window.confirmationResult) return;
    setLoading(true);
    try {
        await window.confirmationResult.confirm(otp);
        toast({ title: 'Login Successful!'});
        router.push('/dashboard');
    } catch (error: any) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'The OTP is incorrect. Please try again.',
        });
    } finally {
        setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center gap-8">
      <div id="recaptcha-container"></div>
      <AppLogo />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login with Phone</CardTitle>
          <CardDescription>
            {otpSent ? 'Enter the OTP sent to your phone.' : 'Enter your phone number to receive an OTP.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            {!otpSent ? (
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="+1 123 456 7890" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required 
                    />
                </div>
            ) : (
                <div className="grid gap-2">
                    <Label htmlFor="otp">OTP</Label>
                    <Input 
                        id="otp" 
                        type="text" 
                        placeholder="123456" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required 
                    />
              </div>
            )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            {!otpSent ? (
                <Button className="w-full" onClick={handleSendOtp} disabled={loading}>
                    {loading ? 'Sending...' : 'Send OTP'}
                </Button>
            ) : (
                <Button className="w-full" onClick={handleVerifyOtp} disabled={loading}>
                     {loading ? 'Verifying...' : 'Verify OTP & Login'}
                </Button>
            )}
             <Link href="/login" className="underline text-sm text-primary">
                Back to other login methods
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

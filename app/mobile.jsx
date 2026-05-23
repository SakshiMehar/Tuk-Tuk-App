import { sendOtp } from "../src/api/authApi";

const handleContinue = async () => {

  try {

    setLoading(true);

    const formattedPhone = `+91${phone}`;

    const response = await sendOtp(formattedPhone);

    console.log("OTP Sent:", response);

    router.push({
      pathname: "/verify-otp",
      params: {
        phone: formattedPhone,
      },
    });

  } catch (error) {

    console.log(error);

    Alert.alert(
      "Error",
      "Failed to send OTP"
    );

  } finally {

    setLoading(false);
  }
};
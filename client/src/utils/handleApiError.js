// utils/handleApiError.js
import { toast } from "react-toastify";

export const handleApiError = (error, defaultMessage = "Something went wrong") => {
    if (error.response) {
        console.error("Server Error:", error.response.data);
        toast.error(error.response.data.message || defaultMessage);
    } else if (error.request) {
        console.error("Network Error:", error.request);
        toast.error("No response from server. Please check your network.");
    } else {
        console.error("Error:", error.message);
        toast.error("Unexpected error: " + error.message);
    }
};

import axios from "axios";
import {
  LOGIN_REQUEST,
  LOGIN_FAIL,
  LOGIN_SUCCESS,
  CLEAR_ERRORS,
  REGISTER_USER_FAIL,
  REGISTER_USER_REQUEST,
  REGISTER_USER_SUCCESS,
  LOAD_USER_REQUEST,
  LOAD_USER_SUCCESS,
  LOAD_USER_FAIL,
  LOGOUT_SUCCESS,
  LOGOUT_FAIL,
  UPDATE_PROFILE_REQUEST,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PROFILE_FAIL,
  UPDATE_PASSWORD_FAIL,
  UPDATE_PASSWORD_SUCCESS,
  UPDATE_PASSWORD_REQUEST,
  FORGOT_PASSWORD_REQUEST,
  FORGOT_PASSWORD_SUCCESS,
  FORGOT_PASSWORD_FAIL,
  RESET_PASSWORD_REQUEST,
  RESET_PASSWORD_SUCCESS,
  RESET_PASSWORD_FAIL,
  ALL_USERS_REQUEST,
  ALL_USERS_SUCCESS,
  ALL_USERS_FAIL,
  USER_DETAILS_REQUEST,
  USER_DETAILS_SUCCESS,
  UPDATE_USER_REQUEST,
  USER_DETAILS_FAIL,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_FAIL,
  DELETE_USER_REQUEST,
  DELETE_USER_FAIL,
  DELETE_USER_SUCCESS,
} from "../constants/userConstant";
import { toast } from "react-toastify";

// const token = localStorage.getItem('token');
import { getAccessToken, setAccessToken, removeAccessToken } from "../utils/auth";
import { isTokenExpired } from "../utils/checkTokenExpiry";

// login user
export function login(email, password) {

  return async function (dispatch) {
    try {
      dispatch({ type: LOGIN_REQUEST });

      const config = {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      };

      const { data } = await axios.post(
        "http://localhost:5000/api/v1/login",
        { email, password },
        config
      );

      // // console.log(data);
      // localStorage.setItem("token", data.token)
      // //const { data1 } = await axios.get("/api/v1/profile");
      setAccessToken(data.accessToken);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      dispatch({ type: LOGIN_SUCCESS, payload: data.user });
      toast.success("Login Success!")

    } catch (error) {
      toast.error("Wrong ID or Password")
      dispatch({ type: LOGIN_FAIL, payload: error.message });
    }
  };
}

// resgister user
export function signUp(signupData) {
  return async function (dispatch) {
    try {
      dispatch({ type: REGISTER_USER_REQUEST });
      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      };

      const { data } = await axios.post(
        "http://localhost:5000/api/v1/register",
        signupData,
        config
      );
      setAccessToken(data.accessToken);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      dispatch({ type: REGISTER_USER_SUCCESS, payload: data.user });
    } catch (error) {
      dispatch({ type: REGISTER_USER_FAIL, payload: error.message })
      toast.error("Failed to Create New User");
    }
  };

}

// Load User (user Profile) if logged in before
export const load_UserProfile = () => async (dispatch) => {
  dispatch({ type: LOAD_USER_REQUEST });
  let token = getAccessToken();

  // Step A: Check In-Memory Token
  if (token && !isTokenExpired(token)) {
    // Token exists in memory and is not expired
    try {
      // Optionally, verify by fetching profile, or trust sessionStorage if populated by login/signup
      const cachedUserData = sessionStorage.getItem("user");
      if (cachedUserData && cachedUserData !== "undefined") {
        dispatch({ type: LOAD_USER_SUCCESS, payload: JSON.parse(cachedUserData) });
        return;
      }
      // If no session storage, fetch profile with existing token
      const config = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
      const { data } = await axios.get("http://localhost:5000/api/v1/profile", config);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      dispatch({ type: LOAD_USER_SUCCESS, payload: data.user });
      return;
    } catch (error) {
      // Token might be invalid on the server despite not being expired locally
      // Proceed to refresh
      // console.warn("In-memory token failed validation, proceeding to refresh.", error);
      token = null; // Force refresh
    }
  }

  // Step B: Attempt Token Refresh (if no token, or in-memory token was expired or failed validation)
  try {
    // console.log("Attempting token refresh...");
    const { data: refreshData } = await axios.post(
      "http://localhost:5000/api/v1/refresh",
      {},
      { withCredentials: true } // Sends the HttpOnly refresh token cookie
    );

    if (refreshData.success && refreshData.accessToken) {
      setAccessToken(refreshData.accessToken);
      // console.log("Token refreshed successfully. Fetching user profile...");

      // Fetch user profile with the new access token
      const config = { headers: { Authorization: `Bearer ${refreshData.accessToken}` }, withCredentials: true };
      const { data: userProfileData } = await axios.get("http://localhost:5000/api/v1/profile", config);

      sessionStorage.setItem("user", JSON.stringify(userProfileData.user));
      dispatch({ type: LOAD_USER_SUCCESS, payload: userProfileData.user });
    } else {
      // Refresh failed to return an accessToken
      // console.log("Refresh was successful but no access token in response or success false.");
      removeAccessToken();
      sessionStorage.removeItem("user");
      dispatch({ type: LOAD_USER_FAIL, payload: "Failed to refresh session." });
    }
  } catch (error) {
    // console.error("Token refresh failed:", error.response ? error.response.data.message : error.message);
    removeAccessToken();
    sessionStorage.removeItem("user");
    dispatch({ type: LOAD_USER_FAIL, payload: error.response?.data?.message || "Session expired. Please log in again." });
  }
};

// Logout
export function logout() {
  return async function (dispatch) {
    try {
      await axios.get("http://localhost:5000/api/v1/logout", { withCredentials: true });
      removeAccessToken(); // Clear in-memory access token
      sessionStorage.removeItem("user"); // Clear user data from session storage
      dispatch({ type: LOGOUT_SUCCESS });
      toast.success("Logged out successfully!");
    } catch (error) {
      // Even if logout API call fails, still clear client-side session
      removeAccessToken();
      sessionStorage.removeItem("user");
      dispatch({ type: LOGOUT_FAIL, payload: error.message });
      toast.error("Logout failed. Cleared local session.");
    }
  };
}

// Update Profile
export function updateProfile(userData) {
  return async function (dispatch) {
    try {
      dispatch({ type: UPDATE_PROFILE_REQUEST });

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        withCredentials: true,
      };

      const { data } = await axios.put(
        "http://localhost:5000/api/v1/profile/update",
        userData,
        config
      );

      sessionStorage.setItem("user", JSON.stringify(data.user));
      dispatch({ type: UPDATE_PROFILE_SUCCESS, payload: data.success });
    } catch (error) {
      dispatch({ type: UPDATE_PROFILE_FAIL, payload: error.message });
    }
  };
}

// Update Password
export function updatePassword(userPassWord) {
  return async function (dispatch) {
    try {
      dispatch({ type: UPDATE_PASSWORD_REQUEST });

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        withCredentials: true,
      };

      const { data } = await axios.put(
        "http://localhost:5000/api/v1/password/update",
        userPassWord,
        config
      );

      dispatch({ type: UPDATE_PASSWORD_SUCCESS, payload: data.success });
    } catch (error) {
      dispatch({ type: UPDATE_PASSWORD_FAIL, payload: error.message });
    }
  };
}

// forgetPassword;
export function forgetPassword(email) {
  return async function (dispatch) {
    try {
      dispatch({ type: FORGOT_PASSWORD_REQUEST });

      const config = {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      };

      const { data } = await axios.post(
        `http://localhost:5000/api/v1/password/forgot`,
        { email }, 
        config
      );

     dispatch({ type: FORGOT_PASSWORD_SUCCESS, payload: data.message });
    } catch (error) {
      dispatch({
        type: FORGOT_PASSWORD_FAIL,
        payload: error.response?.data?.message || error.message,
      });
    }
  };
}

// reset password action
export const resetPassword = (token, passwords) => async (dispatch) => {
  try {
    dispatch({ type: RESET_PASSWORD_REQUEST });
    const config = {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    };

    const { data } = await axios.put(
      `http://localhost:5000/api/v1/password/reset/${token}`,
      passwords,
      config
    );

    dispatch({ type: RESET_PASSWORD_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: RESET_PASSWORD_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Admin - Get All Users
export const getAllUsers = () => async (dispatch) => {
  try {
    dispatch({ type: ALL_USERS_REQUEST });

    const config = {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      withCredentials: true,
    };

    const { data } = await axios.get("http://localhost:5000/api/v1/admin/users", config);

    dispatch({ type: ALL_USERS_SUCCESS, payload: data.users });
  } catch (error) {
    dispatch({ type: ALL_USERS_FAIL, payload: error.message });
  }
};

// Admin - Get User Details
export const getUserDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: USER_DETAILS_REQUEST });

    const config = {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      withCredentials: true,
    };

    const { data } = await axios.get(`http://localhost:5000/api/v1/admin/user/${id}`, config);

    dispatch({ type: USER_DETAILS_SUCCESS, payload: data.user });
  } catch (error) {
    dispatch({ type: USER_DETAILS_FAIL, payload: error.message });
  }
};

// Admin - Update User
export const updateUser = (id, userData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_USER_REQUEST });

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      withCredentials: true,
    };

    const { data } = await axios.put(
      `http://localhost:5000/api/v1/admin/user/${id}`,
      userData,
      config
    );

    dispatch({ type: UPDATE_USER_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({ type: UPDATE_USER_FAIL, payload: error.message });
  }
};


// Admin - Delete User
export const deleteUser = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_USER_REQUEST });

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      withCredentials: true,
    };

    const { data } = await axios.delete(`http://localhost:5000/api/v1/admin/user/${id}`, config);

    dispatch({ type: DELETE_USER_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: DELETE_USER_FAIL, payload: error.message });
  }
};

// Clearing Errors
export const clearErrors = () => async (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
};

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
import { getAccessToken, setAccessToken } from "../utils/auth";
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
  try {
    dispatch({ type: LOAD_USER_REQUEST });

    let token = getAccessToken();

    // ✅ Try to refresh token if expired
    if (!token || isTokenExpired()) {
      const { data } = await axios.post(
        "http://localhost:5000/api/v1/refresh",
        {},
        { withCredentials: true }
      );
      setAccessToken(data.accessToken);
      token = data.accessToken;
    }

    const config = {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    };

    const userData = sessionStorage.getItem("user");

    if (userData && userData !== "undefined") {
      dispatch({ type: LOAD_USER_SUCCESS, payload: JSON.parse(userData) });
    } else {
      const { data } = await axios.get("http://localhost:5000/api/v1/profile", config);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      dispatch({ type: LOAD_USER_SUCCESS, payload: data.user });
    }

  } catch (error) {
    dispatch({ type: LOAD_USER_FAIL, payload: error.message });
  }
};

// Logout
export function logout() {
  return async function (dispatch) {
    try {
      sessionStorage.removeItem("user");
      await axios.get("http://localhost:5000/api/v1/logout", { withCredentials: true });
      dispatch({ type: LOGOUT_SUCCESS });
    } catch (error) {
      dispatch({ type: LOGOUT_FAIL, payload: error.message });
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

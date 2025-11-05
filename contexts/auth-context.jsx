"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
  writeBatch,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { updateLastLogin } from "@/lib/firebase-utils"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { logPatientActivity, logDoctorActivity } from "@/lib/activity-logs"
// import { checkSuspiciousLogin, logFailedLoginAttempt } from "@/lib/security-utils"
import { logFailedLoginAttempt } from "@/lib/security-utils"
import { createOrUpdateSession } from "@/lib/session-management"

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userStatus, setUserStatus] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [suspiciousLogin, setSuspiciousLogin] = useState(null)
  const router = useRouter()

  // Update the onAuthStateChanged listener to handle user profile data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set basic user info from Firebase Auth
        setUser(user)

        // Get user role, status, and profile data from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()

            // Set user role and status
            setUserRole(userData.role)
            setUserStatus(userData.status ?? 0)

            // Set complete user profile data
            setUserProfile({
              ...userData,
              // Ensure we have the latest photoURL from auth if available
              photoURL: user.photoURL || userData.photoURL || null,
            })

            // Update last login timestamp
            updateLastLogin(user.uid)

            // Create or update session with proper IP handling
            createOrUpdateSession(user.uid, userData.email || user.email)
          } else {
            // If user document doesn't exist in Firestore yet
            console.warn("User document not found in Firestore")
            setUserProfile({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          // Still set basic profile data from auth object
          setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          })
        }
      } else {
        // Clear all user data on logout
        setUser(null)
        setUserRole(null)
        setUserStatus(null)
        setUserProfile(null)
        setSuspiciousLogin(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Update the signup function to include profile data
  const signup = async (email, password, name, role) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with name
      await updateProfile(user, {
        displayName: name,
      })

      // Create user profile data
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role: role,
        status: 0, // 0 = pending approval, 1 = approved
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), userData)

      // Update local state
      setUserRole(role)
      setUserStatus(0)
      setUserProfile(userData)

      return user
    } catch (error) {
      throw error
    }
  }

  // Add this function inside the AuthProvider component
  const createSampleNotifications = async (userId, role) => {
    try {
      // Check if notifications already exist
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, where("userId", "==", userId), limit(1))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        console.log("Sample notifications already exist")
        return
      }

      console.log("Creating sample notifications for", role)

      // Create sample notifications based on role
      const notifications =
        role === "doctor"
          ? [
              {
                userId,
                type: "appointment",
                action: "add",
                title: "New Appointment",
                message: "John Doe has scheduled an appointment for tomorrow at 10:00 AM.",
                createdAt: serverTimestamp(),
                read: false,
                patientName: "John Doe",
                patientId: "patient123",
              },
              {
                userId,
                type: "record",
                action: "share",
                title: "Record Shared",
                message: "Sarah Johnson has shared her medical records with you.",
                createdAt: serverTimestamp(),
                read: false,
                patientName: "Sarah Johnson",
                patientId: "patient456",
              },
            ]
          : [
              {
                userId,
                type: "prescription",
                action: "add",
                title: "New Prescription",
                message: "Dr. Sarah Johnson has added a new prescription for you.",
                createdAt: serverTimestamp(),
                read: false,
                doctorName: "Dr. Sarah Johnson",
                doctorId: "doctor123",
              },
              {
                userId,
                type: "appointment",
                action: "approve",
                title: "Appointment Approved",
                message: "Your appointment with Dr. Michael Chen has been approved.",
                createdAt: serverTimestamp(),
                read: false,
                doctorName: "Dr. Michael Chen",
                doctorId: "doctor456",
              },
            ]

      // Add notifications to Firestore
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        const notificationRef = doc(collection(db, "notifications"))
        batch.set(notificationRef, notification)
      })

      await batch.commit()
      console.log("Sample notifications created")
    } catch (error) {
      console.error("Error creating sample notifications:", error)
    }
  }

  // Update the login function to handle email/password authentication properly
  // and check for suspicious logins
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user role, status, and profile data from Firestore
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()

        // Set user role and status
        setUserRole(userData.role)
        setUserStatus(userData.status ?? 0)

        // Set complete user profile data
        setUserProfile({
          ...userData,
          // Ensure we have the latest photoURL from auth
          photoURL: user.photoURL || userData.photoURL || null,
        })

        // Update last login timestamp
        updateLastLogin(user.uid)

        // Create sample notifications
        createSampleNotifications(user.uid, userData.role)

        // Create or update session
        const sessionInfo = await createOrUpdateSession(user.uid, userData.email || user.email)

        // Suspicious login check disabled - causing false positives
        // const deviceInfo = {
        //   deviceName: sessionInfo.deviceName,
        //   deviceType: sessionInfo.deviceType,
        //   userAgent: navigator.userAgent,
        // }

        // const securityCheck = await checkSuspiciousLogin(user.uid, sessionInfo.ipAddress, deviceInfo)

        // if (securityCheck.isSuspicious) {
        //   setSuspiciousLogin({
        //     ...securityCheck,
        //     ipAddress: sessionInfo.ipAddress,
        //     deviceInfo,
        //   })

        //   // Log the suspicious login to the user's activity
        //   if (userData.role === "patient") {
        //     await logPatientActivity("Suspicious Login", `Suspicious login detected from ${deviceInfo.deviceName}`, {
        //       id: user.uid,
        //       email: userData.email || user.email,
        //     })
        //   } else if (userData.role === "doctor") {
        //     await logDoctorActivity("Suspicious Login", `Suspicious login detected from ${deviceInfo.deviceName}`, {
        //       id: user.uid,
        //       email: userData.email || user.email,
        //     })
        //   }
        // }
      } else {
        // If user exists in Auth but not in Firestore, create a basic record
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split("@")[0],
          role: "patient", // Default role
          status: 1, // Approved by default for Auth users without Firestore records
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        }

        // Create the user document in Firestore
        await setDoc(userDocRef, userData)

        // Set user role and status
        setUserRole("patient")
        setUserStatus(1)
        setUserProfile(userData)

        // Create session
        createOrUpdateSession(user.uid, user.email)
      }

      return user
    } catch (error) {
      console.error("Login error:", error.code, error.message)

      // Log failed login attempt
      try {
        // Try to get the user ID if the email exists
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", email), limit(1))
        const querySnapshot = await getDocs(q)

        let userId = null
        if (!querySnapshot.empty) {
          userId = querySnapshot.docs[0].id
        }

        // Get IP address
        let ipAddress = "Unknown"
        try {
          const response = await fetch("https://api.ipify.org?format=json")
          if (response.ok) {
            const data = await response.json()
            ipAddress = data.ip
          }
        } catch (ipError) {
          console.error("Error getting IP:", ipError)
        }

        // Log the failed attempt
        await logFailedLoginAttempt(userId, email, ipAddress)
      } catch (logError) {
        console.error("Error logging failed login:", logError)
      }

      throw error
    }
  }

  // Update the signInWithGoogle function to also create a session and check for suspicious logins
  const signInWithGoogle = async (defaultRole = "patient") => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)

      let userData

      if (!userDoc.exists()) {
        // New user - create record with default role and pending status
        userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: defaultRole,
          status: 0, // 0 = pending approval, 1 = approved
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        }

        // Store in Firestore
        await setDoc(userDocRef, userData)

        // Update local state
        setUserRole(defaultRole)
        setUserStatus(0)
        setUserProfile(userData)
      } else {
        // Existing user - get role, status, and profile data
        userData = userDoc.data()

        // Set user role and status
        setUserRole(userData.role)
        setUserStatus(userData.status ?? 0)

        // Set complete user profile data
        setUserProfile({
          ...userData,
          // Ensure we have the latest photoURL from auth
          photoURL: user.photoURL || userData.photoURL || null,
        })

        // Update last login timestamp
        updateLastLogin(user.uid)
      }

      // Create or update session
      const sessionInfo = await createOrUpdateSession(user.uid, user.email)

      // Suspicious login check disabled - causing false positives
      // const deviceInfo = {
      //   deviceName: sessionInfo.deviceName,
      //   deviceType: sessionInfo.deviceType,
      //   userAgent: navigator.userAgent,
      // }

      // const securityCheck = await checkSuspiciousLogin(user.uid, sessionInfo.ipAddress, deviceInfo)

      // if (securityCheck.isSuspicious) {
      //   setSuspiciousLogin({
      //     ...securityCheck,
      //     ipAddress: sessionInfo.ipAddress,
      //     deviceInfo,
      //   })

      //   // Log the suspicious login to the user's activity
      //   if (userData.role === "patient") {
      //     await logPatientActivity("Suspicious Login", `Suspicious login detected from ${deviceInfo.deviceName}`, {
      //       id: user.uid,
      //       email: userData.email || user.email,
      //     })
      //   } else if (userData.role === "doctor") {
      //     await logDoctorActivity("Suspicious Login", `Suspicious login detected from ${deviceInfo.deviceName}`, {
      //       id: user.uid,
      //       email: userData.email || user.email,
      //     })
      //   }
      // }

      return user
    } catch (error) {
      // Handle popup closed error gracefully
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Sign-in popup was closed before completing the sign-in process")
        // Don't throw an error for this specific case
        return null
      }
      throw error
    }
  }

  // Update the logout function to clean up sessions
  const logout = async () => {
    try {
      // Clear the session heartbeat interval
      if (window.sessionHeartbeat) {
        clearInterval(window.sessionHeartbeat)
      }

      // Get the current session token and user ID
      const sessionToken = localStorage.getItem("sessionToken")
      const userId = auth.currentUser?.uid

      // Update user status to offline in Firestore FIRST
      if (userId) {
        try {
          const userDocRef = doc(db, "users", userId)
          await updateDoc(userDocRef, {
            isOnline: false,
          })
        } catch (error) {
          console.error("Error updating user status to offline:", error)
          // Continue with logout even if status update fails
        }
      }

      if (sessionToken) {
        // Find and remove the session from Firestore
        try {
          const sessionsRef = collection(db, "sessions")
          const q = query(sessionsRef, where("sessionToken", "==", sessionToken))
          const querySnapshot = await getDocs(q)

          querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref)
          })
        } catch (error) {
          console.error("Error removing session:", error)
        }

        // Clear the session token
        localStorage.removeItem("sessionToken")
      }

      await signOut(auth)
      // Redirect to the welcome page
      router.push("/")
    } catch (error) {
      throw error
    }
  }

  // Function to confirm a suspicious login as legitimate
  const confirmSuspiciousLogin = async () => {
    if (!suspiciousLogin || !user) return

    try {
      // Add the device and IP to trusted data
      const userRef = doc(db, "users", user.uid)

      // Add trusted device
      const deviceName = suspiciousLogin.deviceInfo.deviceName
      const trustedDevicesRef = doc(collection(db, "users", user.uid, "trusted"), "devices")
      const trustedDevicesDoc = await getDoc(trustedDevicesRef)

      if (trustedDevicesDoc.exists()) {
        const devices = trustedDevicesDoc.data().names || []
        if (!devices.includes(deviceName)) {
          await updateDoc(trustedDevicesRef, {
            names: [...devices, deviceName],
          })
        }
      } else {
        await setDoc(trustedDevicesRef, {
          names: [deviceName],
        })
      }

      // Add trusted location
      const ipAddress = suspiciousLogin.ipAddress
      const trustedLocationsRef = doc(collection(db, "users", user.uid, "trusted"), "locations")
      const trustedLocationsDoc = await getDoc(trustedLocationsRef)

      if (trustedLocationsDoc.exists()) {
        const locations = trustedLocationsDoc.data().ips || []
        if (!locations.includes(ipAddress)) {
          await updateDoc(trustedLocationsRef, {
            ips: [...locations, ipAddress],
          })
        }
      } else {
        await setDoc(trustedLocationsRef, {
          ips: [ipAddress],
        })
      }

      // Clear the suspicious login state
      setSuspiciousLogin(null)

      return true
    } catch (error) {
      console.error("Error confirming suspicious login:", error)
      return false
    }
  }

  // Function to reject a suspicious login
  const rejectSuspiciousLogin = async () => {
    if (!suspiciousLogin || !user) return

    try {
      // Log the rejection
      await addDoc(collection(db, "rejectedLogins"), {
        userId: user.uid,
        ipAddress: suspiciousLogin.ipAddress,
        deviceInfo: suspiciousLogin.deviceInfo,
        reasons: suspiciousLogin.reasons,
        threatScore: suspiciousLogin.threatScore,
        timestamp: serverTimestamp(),
      })

      // Clear the suspicious login state
      setSuspiciousLogin(null)

      // Log out the user for security
      await logout()

      return true
    } catch (error) {
      console.error("Error rejecting suspicious login:", error)
      return false
    }
  }

  // Upload profile photo and update user profile
  async function uploadProfilePhoto(userId, file) {
    try {
      // Get the current user data to determine role
      const userDoc = await getDoc(doc(db, "users", userId))
      const userData = userDoc.exists() ? userDoc.data() : { role: "patient" }

      // Create a reference to the file location
      const storageRef = ref(storage, `profile_photos/${userId}`)

      // Upload the file
      await uploadBytes(storageRef, file)

      // Get the download URL
      const photoURL = await getDownloadURL(storageRef)

      // Update the user document with the photo URL
      await updateDoc(doc(db, "users", userId), {
        photoURL,
        updatedAt: serverTimestamp(),
      })

      // Update the auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL })
      }

      // Log the profile photo update based on user role
      if (userData.role === "patient") {
        await logPatientActivity("Profile Photo Updated", `Patient updated their profile photo`, {
          id: userId,
          email: userData.email || auth.currentUser?.email,
        })
      } else if (userData.role === "doctor") {
        await logDoctorActivity("Profile Photo Updated", `Doctor updated their profile photo`, {
          id: userId,
          email: userData.email || auth.currentUser?.email,
        })
      }

      return photoURL
    } catch (error) {
      console.error("Error uploading profile photo:", error)
      throw error
    }
  }

  // Update the context value to include userProfile and suspicious login handling
  const value = {
    user,
    userRole,
    userStatus,
    userProfile,
    loading,
    suspiciousLogin,
    signup,
    login,
    signInWithGoogle,
    logout,
    uploadProfilePhoto,
    confirmSuspiciousLogin,
    rejectSuspiciousLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

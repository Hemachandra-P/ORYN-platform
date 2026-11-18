import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function MobileProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>RS</Text>
        </View>
        <Text style={styles.name}>Rahul Sharma</Text>
        <Text style={styles.email}>rahul@example.com</Text>

        <View style={styles.tierPill}>
          <Text style={styles.tierText}>PREMIUM MEMBER</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Household Notification Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Payment Methods & UPI ID</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Annual Subscription Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuText, { color: "#FF6B5B" }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4EDE0",
    padding: 16,
  },
  userCard: {
    backgroundColor: "#14213D",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF6B5B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  email: {
    fontSize: 12,
    color: "#A9B4C3",
    marginTop: 2,
  },
  tierPill: {
    marginTop: 12,
    backgroundColor: "rgba(255, 107, 91, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FF6B5B",
    letterSpacing: 1,
  },
  menu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 2,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F4EDE0",
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14213D",
  },
});

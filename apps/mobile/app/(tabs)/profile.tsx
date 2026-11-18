import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

export default function MobileProfileScreen() {
  const [showPlans, setShowPlans] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>RS</Text>
        </View>
        <Text style={styles.name}>Rahul Sharma</Text>
        <Text style={styles.email}>rahul@example.com</Text>

        <View style={styles.tierPill}>
          <Text style={styles.tierText}>PREMIUM HOUSEHOLD MEMBER</Text>
        </View>
      </View>

      {/* Subscription Plans Card */}
      <View style={styles.plansCard}>
        <Text style={styles.plansHeading}>Subscription Offerings</Text>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planName}>Free Plan</Text>
            <Text style={styles.planDesc}>1 individual user • Free browsing</Text>
          </View>
          <Text style={styles.planPrice}>₹0</Text>
        </View>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planName}>Basic Plus</Text>
            <Text style={styles.planDesc}>Up to 3 members • Splits, bills & chores</Text>
          </View>
          <Text style={styles.planPrice}>₹49/yr</Text>
        </View>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planName}>Premium Household</Text>
            <Text style={styles.planDesc}>Unlimited members • All features</Text>
          </View>
          <Text style={[styles.planPrice, { color: "#FF6B5B" }]}>₹99/6mo</Text>
        </View>
        <View style={[styles.planRow, { borderBottomWidth: 0 }]}>
          <View>
            <Text style={styles.planName}>Marketplace Membership</Text>
            <Text style={styles.planDesc}>Unlimited buying & selling pass</Text>
          </View>
          <Text style={styles.planPrice}>₹20/6mo</Text>
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
          <Text style={styles.menuText}>Household & Marketplace Subscriptions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuText, { color: "#FF6B5B" }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    marginBottom: 16,
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
  plansCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  plansHeading: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#14213D",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F4EDE0",
  },
  planName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#14213D",
  },
  planDesc: {
    fontSize: 10,
    color: "#7A8799",
    marginTop: 2,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: "black",
    color: "#14213D",
  },
  menu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 2,
    marginBottom: 32,
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

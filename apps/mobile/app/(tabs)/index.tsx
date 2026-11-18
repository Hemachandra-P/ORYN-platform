import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";

export default function HouseholdScreen() {
  const [household, setHousehold] = useState({
    name: "Estancia · Tower A · Flat 404",
    code: "ESTANCIA404",
    address: "Estancia · Tower A · Flat: 404 (Free Plan: 3/3 members)",
  });

  const [balances, setBalances] = useState([
    { name: "Rahul Sharma", balance: 1000, status: "Gets Back" },
    { name: "Joy Mukherjee", balance: -200, status: "Owes" },
    { name: "Arjun Patel", balance: -200, status: "Owes" },
    { name: "Priya Sundaram", balance: -200, status: "Owes" },
    { name: "Sneha Reddy", balance: -200, status: "Owes" },
    { name: "Karthik Raj", balance: -200, status: "Owes" },
  ]);

  const [recentExpenses, setRecentExpenses] = useState([
    { title: "Weekly Supermarket Groceries", amount: "₹1,200.00", payer: "Rahul", date: "2 days ago" },
    { title: "Airtel Fiber Broadband", amount: "₹900.00", payer: "Joy", date: "5 days ago" },
  ]);

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CODE: {household.code}</Text>
        </View>
        <Text style={styles.title}>{household.name}</Text>
        <Text style={styles.subtitle}>{household.address}</Text>
      </View>

      {/* Settle Up Quick Bar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Roommate Net Balances</Text>
        <View style={styles.balanceGrid}>
          {balances.map((b, idx) => {
            const isPos = b.balance > 0;
            return (
              <View key={idx} style={styles.balanceCard}>
                <Text style={styles.memberName}>{b.name}</Text>
                <Text style={[styles.balanceAmount, { color: isPos ? "#10B981" : "#FF6B5B" }]}>
                  {isPos ? `+₹${b.balance}` : `-₹${Math.abs(b.balance)}`}
                </Text>
                <Text style={styles.balanceStatus}>{b.status}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent Shared Expenses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Shared Expenses</Text>
        {recentExpenses.map((exp, idx) => (
          <View key={idx} style={styles.expenseItem}>
            <View>
              <Text style={styles.expenseTitle}>{exp.title}</Text>
              <Text style={styles.expenseSub}>Paid by {exp.payer} • {exp.date}</Text>
            </View>
            <Text style={styles.expensePrice}>{exp.amount}</Text>
          </View>
        ))}
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
  cardHeader: {
    backgroundColor: "#14213D",
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: "rgba(255, 107, 91, 0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: "#FF6B5B",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "#A9B4C3",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#14213D",
    marginBottom: 12,
  },
  balanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    width: "48%",
    shadowColor: "#14213D",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  memberName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#14213D",
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  balanceStatus: {
    fontSize: 10,
    color: "#7A8799",
    marginTop: 2,
    textTransform: "uppercase",
  },
  expenseItem: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    elevation: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#14213D",
  },
  expenseSub: {
    fontSize: 11,
    color: "#7A8799",
    marginTop: 2,
  },
  expensePrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#14213D",
  },
});

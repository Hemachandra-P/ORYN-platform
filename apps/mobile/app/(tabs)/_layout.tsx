import { Tabs } from "expo-router";
import React from "react";
import { Text, View, StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6B5B",
        tabBarInactiveTintColor: "#A9B4C3",
        tabBarStyle: {
          backgroundColor: "#14213D",
          borderTopColor: "#253A56",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: "#14213D",
        },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Household",
          tabBarLabel: "Household",
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Marketplace",
          tabBarLabel: "Marketplace",
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: "Shopping",
          tabBarLabel: "Shopping",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}

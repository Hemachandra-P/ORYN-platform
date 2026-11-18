import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from "react-native";

export default function MobileMarketplaceScreen() {
  const [search, setSearch] = useState("");
  const items = [
    { title: "Green Soul Ergonomic Office Chair", price: "₹2,200", condition: "Like New", loc: "Potheri", movingOut: false },
    { title: "IFB 20L Convection Microwave", price: "₹3,499", condition: "Good", loc: "Skyline Heights", movingOut: true },
    { title: "Godrej 99L Mini Refrigerator", price: "₹5,800", condition: "Like New", loc: "Skyline Heights", movingOut: true },
    { title: "CS Engineering Textbooks (7 Books)", price: "₹850", condition: "Good", loc: "SRM Gate 1", movingOut: false },
    { title: "Hercules Roadeo 21-Speed Mountain Bike", price: "₹4,200", condition: "Good", loc: "Abode Valley", movingOut: false },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, furniture, cycles..."
          placeholderTextColor="#A9B4C3"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.heading}>Popular Listings Near Campus</Text>

      {items.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardPrice}>{item.price}</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.conditionBadge}>
              <Text style={styles.badgeText}>{item.condition}</Text>
            </View>
            {item.movingOut && (
              <View style={styles.movingOutBadge}>
                <Text style={styles.movingOutText}>Moving Out Sale</Text>
              </View>
            )}
            <Text style={styles.locText}>📍 {item.loc}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4EDE0",
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#14213D",
    elevation: 2,
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#14213D",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#14213D",
    flex: 1,
    marginRight: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "black",
    color: "#14213D",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  conditionBadge: {
    backgroundColor: "#F4EDE0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#14213D",
  },
  movingOutBadge: {
    backgroundColor: "#FF6B5B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  movingOutText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  locText: {
    fontSize: 11,
    color: "#7A8799",
  },
});

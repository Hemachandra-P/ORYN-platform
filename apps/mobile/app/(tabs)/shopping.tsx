import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

export default function MobileShoppingScreen() {
  const [items, setItems] = useState([
    { id: "1", title: "Cow Milk (Nandini / Aavin 2L)", qty: "2 pkts", done: false },
    { id: "2", title: "Sunflower Cooking Oil", qty: "1 Litre", done: false },
    { id: "3", title: "India Gate Basmati Rice 5kg", qty: "1 bag", done: true },
    { id: "4", title: "Dishwashing Liquid Soap", qty: "1 bottle", done: false },
  ]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Shared Flat Supplies Checklist</Text>

      {items.map((it) => (
        <TouchableOpacity
          key={it.id}
          style={styles.card}
          onPress={() => toggleItem(it.id)}
        >
          <View style={styles.row}>
            <View style={[styles.checkbox, it.done && styles.checkboxActive]}>
              {it.done && <Text style={styles.checkText}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, it.done && styles.itemDone]}>
                {it.title}
              </Text>
              <Text style={styles.itemQty}>{it.qty}</Text>
            </View>
          </View>
        </TouchableOpacity>
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
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#14213D",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#A9B4C3",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#FF6B5B",
    borderColor: "#FF6B5B",
  },
  checkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#14213D",
  },
  itemDone: {
    textDecorationLine: "line-through",
    color: "#7A8799",
  },
  itemQty: {
    fontSize: 11,
    color: "#7A8799",
    marginTop: 2,
  },
});

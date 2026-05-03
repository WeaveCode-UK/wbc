import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  useTheme,
  SearchBar,
  SegmentedControl,
  Avatar,
  Badge,
} from "@wbc/ui-native";
import { listClients } from "../lib/offline-repos";
import { useTenantId } from "../lib/tenant-context";

interface ClientView {
  id: string;
  name: string;
  phone: string;
  classification: "A" | "B" | "C";
  status: "active" | "lead";
  lastPurchase: string;
  totalSpent: string;
}

const mockClients: ClientView[] = [
  {
    id: "1",
    name: "Ana Silva",
    phone: "+55 11 99912-3456",
    classification: "A",
    status: "active",
    lastPurchase: "3 dias",
    totalSpent: "R$ 2.450",
  },
  {
    id: "2",
    name: "Beatriz Santos",
    phone: "+55 11 99887-6543",
    classification: "B",
    status: "active",
    lastPurchase: "12 dias",
    totalSpent: "R$ 980",
  },
  {
    id: "3",
    name: "Carla Oliveira",
    phone: "+55 11 99765-4321",
    classification: "C",
    status: "lead",
    lastPurchase: "Nunca",
    totalSpent: "R$ 0",
  },
  {
    id: "4",
    name: "Diana Ferreira",
    phone: "+55 11 99654-3210",
    classification: "A",
    status: "active",
    lastPurchase: "1 dia",
    totalSpent: "R$ 3.120",
  },
  {
    id: "5",
    name: "Elisa Mendes",
    phone: "+55 11 99543-2109",
    classification: "B",
    status: "active",
    lastPurchase: "20 dias",
    totalSpent: "R$ 540",
  },
];

export function ClientsListScreen() {
  const { md3: c } = useTheme();
  const tenantId = useTenantId();
  const [segment, setSegment] = useState("all");
  const [search, setSearch] = useState("");
  // F11.E27: hydrate from offline SQLite. If the cache is empty (first
  // launch / no sync yet) the mock array stays so the dev experience
  // doesn't regress to a blank screen.
  const [clients, setClients] = useState<ClientView[]>(mockClients);
  useEffect(() => {
    void listClients(tenantId).then((rows) => {
      if (rows.length === 0) return;
      setClients(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          classification: (r.classification ?? "C") as "A" | "B" | "C",
          status: r.isLead ? "lead" : "active",
          lastPurchase: "—",
          totalSpent: "R$ —",
        })),
      );
    });
  }, [tenantId]);

  return (
    <View style={[styles.container, { backgroundColor: c.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.onSurface }]}>Clientes</Text>
        <SearchBar
          placeholder="Buscar cliente..."
          value={search}
          onChangeText={setSearch}
        />
        <SegmentedControl
          options={[
            { value: "all", label: "Todas" },
            { value: "active", label: "Ativas" },
            { value: "leads", label: "Leads" },
            { value: "inactive", label: "Inativas" },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>

      {/* ABC Classification Stats */}
      <View style={styles.abcRow}>
        {[
          {
            label: "TOTAL",
            value: "50",
            color: c.onSurface,
            bg: c.surfaceContainerLowest,
          },
          { label: "CLASSE A", value: "10", color: c.success, bg: c.successBg },
          { label: "CLASSE B", value: "15", color: c.warning, bg: c.warningBg },
          {
            label: "CLASSE C",
            value: "25",
            color: c.outline,
            bg: c.surfaceContainerLow,
          },
        ].map((stat, i) => (
          <View
            key={i}
            style={[
              styles.abcCard,
              {
                backgroundColor: stat.bg,
                borderWidth: 0.5,
                borderColor: c.outlineVariant + "33",
              },
            ]}
          >
            <Text style={[styles.abcValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={[styles.abcLabel, { color: stat.color + "CC" }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Client Cards List */}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85}>
            <View
              style={[
                styles.clientCard,
                {
                  backgroundColor: c.surfaceContainerLowest,
                  borderWidth: 0.5,
                  borderColor: c.outlineVariant + "33",
                },
              ]}
            >
              <Avatar
                name={item.name}
                size="md"
                classification={item.classification}
              />
              <View style={styles.clientInfo}>
                <View style={styles.clientNameRow}>
                  <Text style={[styles.clientName, { color: c.onSurface }]}>
                    {item.name}
                  </Text>
                  <Badge
                    variant={
                      item.classification === "A"
                        ? "success"
                        : item.classification === "B"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {item.classification}
                  </Badge>
                </View>
                <Text style={[styles.clientPhone, { color: c.outline }]}>
                  {item.phone}
                </Text>
                <View style={styles.clientMeta}>
                  <Text
                    style={[
                      styles.clientMetaText,
                      { color: c.onSurfaceVariant },
                    ]}
                  >
                    Ultima compra:{" "}
                    <Text style={{ fontWeight: "600" }}>
                      {item.lastPurchase}
                    </Text>
                  </Text>
                  <View
                    style={[
                      styles.metaDot,
                      { backgroundColor: c.outlineVariant },
                    ]}
                  />
                  <Text
                    style={[
                      styles.clientMetaText,
                      { color: c.onSurfaceVariant },
                    ]}
                  >
                    Total:{" "}
                    <Text style={{ fontWeight: "600" }}>{item.totalSpent}</Text>
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Epilogue",
    letterSpacing: -0.3,
  },
  abcRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  abcCard: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  abcValue: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Epilogue",
    letterSpacing: -0.5,
  },
  abcLabel: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Manrope",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 10,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  clientInfo: {
    flex: 1,
    gap: 2,
  },
  clientNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clientName: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Sora",
    flex: 1,
  },
  clientPhone: {
    fontSize: 11,
    fontFamily: "Manrope",
    marginTop: 1,
  },
  clientMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  clientMetaText: {
    fontSize: 11,
    fontFamily: "Manrope",
    fontWeight: "400",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});

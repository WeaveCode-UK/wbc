import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme, Avatar, Badge, ProgressBar, Card } from "@wbc/ui-native";
import {
  getClient,
  listSalesForClient,
  type OfflineClient,
  type OfflineSale,
} from "../lib/offline-repos";
import { useTenantId } from "../lib/tenant-context";

interface ClientProfileScreenProps {
  clientId?: string;
}

export function ClientProfileScreen({
  clientId,
}: ClientProfileScreenProps = {}) {
  const { md3: c } = useTheme();
  const tenantId = useTenantId();
  const [client, setClient] = useState<OfflineClient | null>(null);
  const [sales, setSales] = useState<OfflineSale[]>([]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    void Promise.all([
      getClient(tenantId, clientId),
      listSalesForClient(tenantId, clientId),
    ]).then(([cl, ss]) => {
      if (cancelled) return;
      setClient(cl);
      setSales(ss);
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId, clientId]);

  const displayName = client?.name ?? "Ana Silva";
  const classification = (client?.classification ?? "A") as "A" | "B" | "C";
  const totalSpent = sales.reduce((sum, s) => sum + s.total, 0);
  const purchases = sales.length;
  const formatBRL = (v: number): string =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: c.surface }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View
        style={[
          styles.profileHeader,
          {
            backgroundColor: c.surfaceContainerLowest,
            borderColor: c.outlineVariant + "33",
          },
        ]}
      >
        <Avatar name={displayName} size="xl" classification={classification} />
        <Text style={[styles.name, { color: c.onSurface }]}>{displayName}</Text>
        <Badge
          variant={
            classification === "A"
              ? "success"
              : classification === "B"
                ? "warning"
                : "neutral"
          }
        >
          {`Classe ${classification}`}
        </Badge>
        <Text style={[styles.clientSince, { color: c.outline }]}>
          Cliente desde Mar 2023
        </Text>
      </View>

      {/* Action Strip */}
      <View style={styles.actionStrip}>
        {[
          { icon: "chat", label: "WhatsApp", color: "#25D366" },
          { icon: "call", label: "Ligar", color: c.primaryContainer },
          { icon: "shopping_bag", label: "Vender", color: c.success },
          { icon: "edit_note", label: "Nota", color: c.tertiary },
        ].map((action, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.85}
            style={[
              styles.actionBtn,
              {
                backgroundColor: c.surfaceContainerLowest,
                borderWidth: 0.5,
                borderColor: c.outlineVariant + "33",
              },
            ]}
          >
            <View
              style={[
                styles.actionIconWrap,
                { backgroundColor: action.color + "1A" },
              ]}
            >
              <Text style={[styles.actionIcon, { color: action.color }]}>
                {action.icon}
              </Text>
            </View>
            <Text style={[styles.actionLabel, { color: c.onSurface }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Grid */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.overlineLabel, { color: c.outline }]}>
          ESTATISTICAS
        </Text>
      </View>
      <View style={styles.statsGrid}>
        {[
          {
            label: "COMPRAS",
            value: purchases > 0 ? String(purchases) : "12",
            color: c.primaryContainer,
          },
          {
            label: "TOTAL GASTO",
            value: totalSpent > 0 ? formatBRL(totalSpent) : "R$ 2.450",
            color: c.success,
          },
          { label: "ULTIMA COMPRA", value: "3 dias", color: c.onSurface },
          { label: "TICKET MEDIO", value: "R$ 204", color: c.onSurface },
          { label: "CASHBACK", value: "R$ 45", color: c.tertiary },
          { label: "SCORE", value: "85", color: c.primaryContainer },
        ].map((stat, i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              {
                backgroundColor: c.surfaceContainerLowest,
                borderWidth: 0.5,
                borderColor: c.outlineVariant + "33",
              },
            ]}
          >
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: c.outline }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Engajamento */}
      <Card variant="elevated">
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: c.onSurface }]}>
            Engajamento
          </Text>
          <Text style={[styles.cardBadge, { color: c.primaryContainer }]}>
            85/100
          </Text>
        </View>
        <ProgressBar value={85} variant="success" />
        <Text style={[styles.cardHint, { color: c.outline }]}>
          Cliente muito engajada — alto potencial de recompra
        </Text>
      </Card>

      {/* Perfil de Beleza */}
      <Card variant="elevated">
        <Text style={[styles.cardTitle, { color: c.onSurface }]}>
          Perfil de Beleza
        </Text>
        <View style={styles.beautyGrid}>
          {[
            { label: "PELE", value: "Mista" },
            { label: "CABELO", value: "Cacheado" },
            { label: "TOM", value: "Medio" },
            { label: "PREFERENCIA", value: "Sem fragrancia" },
          ].map((item, i) => (
            <View
              key={i}
              style={[
                styles.beautyItem,
                { backgroundColor: c.surfaceContainerLow, borderRadius: 12 },
              ]}
            >
              <Text style={[styles.beautyLabel, { color: c.outline }]}>
                {item.label}
              </Text>
              <Text style={[styles.beautyValue, { color: c.onSurface }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Notas */}
      <Card variant="elevated">
        <Text style={[styles.cardTitle, { color: c.onSurface }]}>Notas</Text>
        <View style={[styles.noteItem, { borderLeftColor: c.tertiary }]}>
          <Text style={[styles.noteText, { color: c.onSurface }]}>
            Prefere produtos sem fragrancia. Aniversario da filha em maio.
          </Text>
          <Text style={[styles.noteDate, { color: c.outline }]}>
            Adicionada em 15 Out 2023
          </Text>
        </View>
        <View style={[styles.noteItem, { borderLeftColor: c.outline }]}>
          <Text style={[styles.noteText, { color: c.onSurface }]}>
            Interessada no Kit Cronos para presente de Natal.
          </Text>
          <Text style={[styles.noteDate, { color: c.outline }]}>
            Adicionada em 02 Nov 2023
          </Text>
        </View>
      </Card>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
    gap: 16,
  },
  profileHeader: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 0.5,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Epilogue",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  clientSince: {
    fontSize: 12,
    fontFamily: "Manrope",
    marginTop: 2,
  },
  actionStrip: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 6,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 18,
    fontFamily: "Material Symbols Outlined",
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Manrope",
  },
  sectionHeaderRow: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  overlineLabel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Manrope",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Epilogue",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Manrope",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Sora",
    marginBottom: 8,
  },
  cardBadge: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Sora",
  },
  cardHint: {
    fontSize: 12,
    fontFamily: "Manrope",
    marginTop: 8,
  },
  beautyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  beautyItem: {
    width: "47%",
    flexGrow: 1,
    padding: 12,
  },
  beautyLabel: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Manrope",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  beautyValue: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Sora",
  },
  noteItem: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    fontFamily: "Sora",
    fontWeight: "400",
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 10,
    fontFamily: "Manrope",
    marginTop: 4,
  },
});

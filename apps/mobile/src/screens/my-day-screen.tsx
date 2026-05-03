import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useTheme, ProgressBar } from "@wbc/ui-native";
import {
  listClients,
  listSales,
  listAppointmentsForDay,
} from "../lib/offline-repos";
import { useTenantId } from "../lib/tenant-context";

interface DaySummary {
  clients: number;
  revenueToday: number;
  appointments: number;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function MyDayScreen() {
  const { md3: c } = useTheme();
  const tenantId = useTenantId();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const [summary, setSummary] = useState<DaySummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    void Promise.all([
      listClients(tenantId),
      listSales(tenantId),
      listAppointmentsForDay(tenantId, start.getTime(), end.getTime()),
    ]).then(([clients, sales, appts]) => {
      if (cancelled) return;
      const revenueToday = sales
        .filter(
          (s) => s.createdAt >= start.getTime() && s.createdAt < end.getTime(),
        )
        .reduce((sum, s) => sum + s.total, 0);
      setSummary({
        clients: clients.length,
        revenueToday,
        appointments: appts.length,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: c.surface }]}
      contentContainerStyle={styles.content}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: c.onSurface }]}>
          {greeting}, Consultora!
        </Text>
        <Text style={[styles.dateText, { color: c.outline }]}>
          Segunda-feira, 23 de Outubro de 2023
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statCardFull,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: c.outlineVariant + "33",
            },
          ]}
        >
          <View style={styles.metaRow}>
            <Text style={[styles.overlineLabel, { color: c.primaryContainer }]}>
              META MENSAL
            </Text>
            <Text style={[styles.metaPercent, { color: c.primaryContainer }]}>
              85%
            </Text>
          </View>
          <ProgressBar value={85} variant="primary" />
          <Text style={[styles.metaHint, { color: c.outline }]}>
            Faltam{" "}
            <Text style={{ color: c.onSurface, fontWeight: "700" }}>
              R$ 1.250
            </Text>{" "}
            para atingir o Plano Diamante
          </Text>
        </View>

        <View
          style={[
            styles.statCardHalf,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: c.outlineVariant + "33",
            },
          ]}
        >
          <Text style={[styles.overlineLabel, { color: c.outline }]}>
            FATURAMENTO
          </Text>
          <Text style={[styles.statValue, { color: c.onSurface }]}>
            {summary ? formatBRL(summary.revenueToday) : "R$ 8.420"}
          </Text>
        </View>

        <View
          style={[
            styles.statCardHalf,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: c.outlineVariant + "33",
            },
          ]}
        >
          <Text style={[styles.overlineLabel, { color: c.outline }]}>
            CLIENTES
          </Text>
          <Text style={[styles.statValue, { color: c.onSurface }]}>
            {summary ? summary.clients : 142}
          </Text>
        </View>
      </View>

      {/* Urgente */}
      <SectionHeader label="URGENTE" color={c.error} />
      <View style={styles.cardList}>
        <AlertCard
          name="Ana Paula Silva"
          detail="Atraso: 3 dias • R$ 450,00"
          action="COBRAR"
          borderColor={c.error}
          actionBg={c.error + "1A"}
          actionText={c.error}
          cardBg={c.surfaceContainerLowest}
          textColor={c.onSurface}
          subColor={c.outline}
        />
        <AlertCard
          name="Mariana Costa"
          detail="Atraso: 5 dias • R$ 120,00"
          action="COBRAR"
          borderColor={c.error}
          actionBg={c.error + "1A"}
          actionText={c.error}
          cardBg={c.surfaceContainerLowest}
          textColor={c.onSurface}
          subColor={c.outline}
        />
      </View>

      {/* Lembretes */}
      <SectionHeader label="LEMBRETES" color={c.tertiary} />
      <View style={styles.cardList}>
        <AlertCard
          name="Reposicao: Kit Cronos"
          detail="Cliente: Bia Oliveira • Ciclo 12"
          action="LEMBRAR"
          borderColor={c.tertiary}
          actionBg={c.tertiary + "1A"}
          actionText={c.tertiary}
          cardBg={c.surfaceContainerLowest}
          textColor={c.onSurface}
          subColor={c.outline}
        />
        <AlertCard
          name="Cashback Expirando"
          detail="Fernanda R. • Saldo R$ 45,00"
          action="LEMBRAR"
          borderColor={c.tertiary}
          actionBg={c.tertiary + "1A"}
          actionText={c.tertiary}
          cardBg={c.surfaceContainerLowest}
          textColor={c.onSurface}
          subColor={c.outline}
        />
      </View>

      {/* Aniversarios */}
      <SectionHeader label="ANIVERSARIOS" color="#059669" />
      <View style={styles.cardList}>
        <View
          style={[
            styles.alertCard,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderLeftColor: "#059669",
            },
          ]}
        >
          <View style={[styles.birthdayAvatar, { backgroundColor: "#ECFDF5" }]}>
            <Text style={{ color: "#059669", fontSize: 14, fontWeight: "600" }}>
              CM
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertName, { color: c.onSurface }]}>
              Carla Mendonca
            </Text>
            <Text style={[styles.alertDetail, { color: c.outline }]}>
              Hoje • 32 anos
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#059669" + "1A" }]}
          >
            <Text style={[styles.actionBtnText, { color: "#059669" }]}>
              PARABENS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Agenda de Hoje */}
      <View style={styles.agendaHeader}>
        <Text style={[styles.agendaTitle, { color: c.onSurface }]}>
          Agenda de Hoje
        </Text>
        <Text style={[styles.agendaLink, { color: c.primaryContainer }]}>
          Ver Calendario
        </Text>
      </View>

      <View style={styles.timeline}>
        <View
          style={[
            styles.timelineLine,
            { backgroundColor: c.surfaceContainerHigh },
          ]}
        />
        <TimelineItem
          time="09:30"
          title="Entrega - Condominio Alpha"
          subtitle="Cliente: Patricia L."
          dotBg={c.primaryContainer}
          dotText="#FFFFFF"
          cardBg={c.surfaceContainerLow}
          textColor={c.onSurface}
          subColor={c.outline}
          timeColor={c.primaryContainer}
          surfaceColor={c.surface}
          opacity={1}
        />
        <TimelineItem
          time="14:00"
          title="Sessao de SkinCare"
          subtitle="Cliente: Roberta Gomes"
          dotBg={c.surfaceVariant}
          dotText={c.outline}
          cardBg={c.surfaceContainerLow}
          textColor={c.onSurface}
          subColor={c.outline}
          timeColor={c.outline}
          surfaceColor={c.surface}
          opacity={0.6}
        />
        <TimelineItem
          time="17:30"
          title="Mentoria Equipe WBC"
          subtitle="Google Meet Link"
          dotBg={c.surfaceVariant}
          dotText={c.outline}
          cardBg={c.surfaceContainerLow}
          textColor={c.onSurface}
          subColor={c.outline}
          timeColor={c.outline}
          surfaceColor={c.surface}
          opacity={0.6}
        />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

function AlertCard({
  name,
  detail,
  action,
  borderColor,
  actionBg,
  actionText,
  cardBg,
  textColor,
  subColor,
}: {
  name: string;
  detail: string;
  action: string;
  borderColor: string;
  actionBg: string;
  actionText: string;
  cardBg: string;
  textColor: string;
  subColor: string;
}) {
  return (
    <View
      style={[
        styles.alertCard,
        { backgroundColor: cardBg, borderLeftColor: borderColor },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertName, { color: textColor }]}>{name}</Text>
        <Text style={[styles.alertDetail, { color: subColor }]}>{detail}</Text>
      </View>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: actionBg }]}
      >
        <Text style={[styles.actionBtnText, { color: actionText }]}>
          {action}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function TimelineItem({
  time,
  title,
  subtitle,
  dotBg,
  dotText,
  cardBg,
  textColor,
  subColor,
  timeColor,
  surfaceColor,
  opacity,
}: {
  time: string;
  title: string;
  subtitle: string;
  dotBg: string;
  dotText: string;
  cardBg: string;
  textColor: string;
  subColor: string;
  timeColor: string;
  surfaceColor: string;
  opacity: number;
}) {
  return (
    <View style={[styles.timelineItem, { opacity }]}>
      <View
        style={[
          styles.timelineDot,
          { backgroundColor: dotBg, borderColor: surfaceColor },
        ]}
      >
        <Text style={{ color: dotText, fontSize: 12, fontWeight: "600" }}>
          {time.substring(0, 2)}
        </Text>
      </View>
      <View style={[styles.timelineCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.timelineTime, { color: timeColor }]}>{time}</Text>
        <Text style={[styles.timelineTitle, { color: textColor }]}>
          {title}
        </Text>
        <Text style={[styles.timelineSub, { color: subColor }]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 80, paddingHorizontal: 16, gap: 24 },
  greeting: { gap: 4 },
  greetingText: {
    fontSize: 28,
    fontWeight: "600",
    fontFamily: "Sora",
    letterSpacing: -0.5,
  },
  dateText: { fontSize: 13, fontFamily: "Sora", fontWeight: "500" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCardFull: {
    width: "100%",
    padding: 20,
    borderRadius: 24,
    borderWidth: 0.5,
    gap: 12,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statCardHalf: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    borderWidth: 0.5,
    gap: 4,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  metaPercent: { fontSize: 16, fontWeight: "700", fontFamily: "Sora" },
  metaHint: { fontSize: 12, fontFamily: "Sora" },
  overlineLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Sora",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Epilogue",
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "Sora",
  },
  cardList: { gap: 10 },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    gap: 12,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  alertName: { fontSize: 14, fontWeight: "700", fontFamily: "Sora" },
  alertDetail: { fontSize: 11, fontFamily: "Manrope", marginTop: 2 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  actionBtnText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Sora",
    letterSpacing: 1,
  },
  birthdayAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  agendaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  agendaTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Sora" },
  agendaLink: { fontSize: 12, fontWeight: "700", fontFamily: "Sora" },
  timeline: { position: "relative", gap: 24 },
  timelineLine: {
    position: "absolute",
    left: 15,
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 1,
  },
  timelineItem: { flexDirection: "row", alignItems: "flex-start", gap: 20 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    marginTop: 4,
  },
  timelineCard: { flex: 1, padding: 16, borderRadius: 16 },
  timelineTime: { fontSize: 10, fontWeight: "700", fontFamily: "Sora" },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Sora",
    marginTop: 4,
  },
  timelineSub: { fontSize: 12, fontFamily: "Manrope", marginTop: 4 },
});

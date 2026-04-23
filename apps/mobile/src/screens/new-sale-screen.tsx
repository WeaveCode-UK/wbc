import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  useTheme,
  StepIndicator,
  Button,
  Avatar,
  Toggle,
  textStyles,
} from "@wbc/ui-native";

type DeliveryMethod = "pessoal" | "correio" | "motoboy" | "retirada";

const DELIVERY_OPTIONS: Array<{
  value: DeliveryMethod;
  label: string;
  icon: string;
}> = [
  { value: "pessoal", label: "Pessoal", icon: "🤝" },
  { value: "correio", label: "Correio", icon: "📦" },
  { value: "motoboy", label: "Motoboy", icon: "🏍️" },
  { value: "retirada", label: "Retirada", icon: "🏠" },
];

interface NewSaleScreenProps {
  onBack?: () => void;
  onSaveDraft?: () => void | Promise<void>;
  onConfirmSale?: () => void | Promise<void>;
}

export function NewSaleScreen({
  onBack,
  onSaveDraft,
  onConfirmSale,
}: NewSaleScreenProps = {}) {
  const { md3: c } = useTheme();
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pessoal");
  const [whatsappConfirm, setWhatsappConfirm] = useState(true);
  const [posVenda, setPosVenda] = useState(true);

  const handleBack = () => {
    if (onBack) onBack();
    else Alert.alert("Voltar", "Navegação ainda não conectada nesta tela.");
  };
  const handleSaveDraft = async () => {
    if (onSaveDraft) await onSaveDraft();
    else Alert.alert("Rascunho salvo", "Você pode retomar esta venda depois.");
  };
  const handleConfirmSale = async () => {
    if (onConfirmSale) await onConfirmSale();
    else Alert.alert("Venda confirmada", "R$ 393,22 registrado.");
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surface }]}>
      {/* Header */}
      <View
        style={[styles.header, { borderBottomColor: c.outlineVariant + "33" }]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            activeOpacity={0.7}
            onPress={handleBack}
            style={[
              styles.backButton,
              { backgroundColor: c.surfaceContainerLow },
            ]}
          >
            <Text style={{ color: c.onSurfaceVariant, fontSize: 18 }}>
              {"←"}
            </Text>
          </TouchableOpacity>
          <View>
            {/* ACH-020: migrated to centralized tokens */}
            <Text style={[textStyles["heading-2"], { color: c.onSurface }]}>
              Nova Venda
            </Text>
            <Text
              style={[textStyles.caption, { color: c.outline, marginTop: 1 }]}
            >
              Passo 4 de 4
            </Text>
          </View>
        </View>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepRow}>
        <StepIndicator total={4} current={3} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: c.outlineVariant + "33",
              borderLeftColor: c.primaryContainer,
            },
          ]}
        >
          <Text style={[styles.overlineLabel, { color: c.primaryContainer }]}>
            RESUMO DO PEDIDO
          </Text>

          {/* Client Info */}
          <View style={styles.clientRow}>
            <Avatar name="Mariana Costa" size="md" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.clientName, { color: c.onSurface }]}>
                Mariana Costa
              </Text>
              <Text style={[styles.clientMeta, { color: c.outline }]}>
                Cliente VIP {"·"} 12 compras
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              { backgroundColor: c.outlineVariant + "1A" },
            ]}
          />

          {/* Items List */}
          <View style={styles.itemsList}>
            <View style={styles.itemRow}>
              <View
                style={[
                  styles.qtyBadge,
                  { backgroundColor: c.primaryContainer + "1A" },
                ]}
              >
                <Text style={[styles.qtyText, { color: c.primaryContainer }]}>
                  1x
                </Text>
              </View>
              <Text style={[styles.itemName, { color: c.onSurface }]}>
                Kit TimeWise
              </Text>
              <Text style={[styles.itemPrice, { color: c.onSurface }]}>
                R$ 329,90
              </Text>
            </View>
            <View style={styles.itemRow}>
              <View
                style={[
                  styles.qtyBadge,
                  { backgroundColor: c.primaryContainer + "1A" },
                ]}
              >
                <Text style={[styles.qtyText, { color: c.primaryContainer }]}>
                  2x
                </Text>
              </View>
              <Text style={[styles.itemName, { color: c.onSurface }]}>
                Batom Matte Intense
              </Text>
              <Text style={[styles.itemPrice, { color: c.onSurface }]}>
                R$ 99,80
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Card — full purple bg */}
        <View
          style={[styles.paymentCard, { backgroundColor: c.primaryContainer }]}
        >
          <Text style={[styles.paymentOverline, { color: c.onPrimary + "CC" }]}>
            VALOR TOTAL
          </Text>
          <Text style={[styles.paymentTotal, { color: c.onPrimary }]}>
            R$ 429,70
          </Text>

          <View
            style={[
              styles.paymentDivider,
              { backgroundColor: c.onPrimary + "1A" },
            ]}
          />

          <View style={styles.paymentLineItem}>
            <Text
              style={[styles.paymentLineLabel, { color: c.onPrimary + "CC" }]}
            >
              Desconto fidelidade (5%)
            </Text>
            <Text
              style={[styles.paymentLineValue, { color: c.onPrimary + "CC" }]}
            >
              - R$ 21,49
            </Text>
          </View>
          <View style={styles.paymentLineItem}>
            <Text
              style={[styles.paymentLineLabel, { color: c.onPrimary + "CC" }]}
            >
              Cashback acumulado
            </Text>
            <Text
              style={[styles.paymentLineValue, { color: c.onPrimary + "CC" }]}
            >
              - R$ 15,00
            </Text>
          </View>

          <View
            style={[
              styles.paymentDivider,
              { backgroundColor: c.onPrimary + "1A" },
            ]}
          />

          <View style={styles.paymentLineItem}>
            <Text style={[styles.paymentFinalLabel, { color: c.onPrimary }]}>
              A Pagar
            </Text>
            <Text style={[styles.paymentFinalValue, { color: c.onPrimary }]}>
              R$ 393,22
            </Text>
          </View>
        </View>

        {/* Delivery Method */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.overlineLabel, { color: c.outline }]}>
            ENTREGA
          </Text>
        </View>

        <View style={styles.deliveryGrid}>
          {DELIVERY_OPTIONS.map((opt) => {
            const isActive = deliveryMethod === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.8}
                onPress={() => setDeliveryMethod(opt.value)}
                style={[
                  styles.deliveryButton,
                  {
                    backgroundColor: isActive
                      ? c.primaryContainer
                      : c.surfaceContainerLowest,
                    borderColor: isActive
                      ? c.primaryContainer
                      : c.outlineVariant + "33",
                  },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                <Text
                  style={[
                    styles.deliveryLabel,
                    { color: isActive ? c.onPrimary : c.onSurface },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Smart Toggles */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.overlineLabel, { color: c.outline }]}>
            AUTOMACOES
          </Text>
        </View>

        <View
          style={[
            styles.toggleCard,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: c.outlineVariant + "33",
            },
          ]}
        >
          <View style={styles.toggleIconBox}>
            <Text style={{ fontSize: 20 }}>💬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleTitle, { color: c.onSurface }]}>
              Confirmacao WhatsApp
            </Text>
            <Text style={[styles.toggleSubtitle, { color: c.outline }]}>
              Enviar resumo do pedido para a cliente
            </Text>
          </View>
          <Toggle value={whatsappConfirm} onChange={setWhatsappConfirm} />
        </View>

        <View
          style={[
            styles.toggleCard,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: c.outlineVariant + "33",
            },
          ]}
        >
          <View style={styles.toggleIconBox}>
            <Text style={{ fontSize: 20 }}>🔄</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleTitle, { color: c.onSurface }]}>
              Pos-venda 2+2+2
            </Text>
            <Text style={[styles.toggleSubtitle, { color: c.outline }]}>
              Lembretes automaticos em 2, 14 e 60 dias
            </Text>
          </View>
          <Toggle value={posVenda} onChange={setPosVenda} />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: c.surfaceContainerLowest,
            borderTopColor: c.outlineVariant + "33",
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Button variant="outline" size="md" onPress={handleSaveDraft}>
            Salvar Rascunho
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="primary" size="md" onPress={handleConfirmSale}>
            Confirmar Venda
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    // ACH-004: Apple HIG + Material recommend 44×44 minimum.
    minWidth: 44,
    minHeight: 44,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Epilogue",
    lineHeight: 23.4,
  },
  headerStep: {
    fontSize: 11,
    fontWeight: "400",
    fontFamily: "Manrope",
    marginTop: 1,
  },

  stepRow: { paddingVertical: 16 },

  scrollContent: { paddingHorizontal: 16, gap: 16 },

  overlineLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Manrope",
    lineHeight: 12,
  },

  /* Order Summary */
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderLeftWidth: 4,
    gap: 14,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  clientName: { fontSize: 15, fontWeight: "700", fontFamily: "Sora" },
  clientMeta: {
    fontSize: 12,
    fontWeight: "400",
    fontFamily: "Manrope",
    marginTop: 2,
  },
  divider: { height: 1, borderRadius: 0.5 },
  itemsList: { gap: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  qtyText: { fontSize: 11, fontWeight: "700", fontFamily: "Manrope" },
  itemName: { flex: 1, fontSize: 13, fontWeight: "500", fontFamily: "Sora" },
  itemPrice: { fontSize: 13, fontWeight: "700", fontFamily: "Sora" },

  /* Payment Card */
  paymentCard: {
    borderRadius: 24,
    padding: 24,
    gap: 8,
    shadowColor: "#8127E8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  paymentOverline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Manrope",
  },
  paymentTotal: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: "Epilogue",
    lineHeight: 38.4,
    letterSpacing: -0.5,
  },
  paymentDivider: { height: 1, borderRadius: 0.5, marginVertical: 4 },
  paymentLineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentLineLabel: { fontSize: 12, fontWeight: "400", fontFamily: "Sora" },
  paymentLineValue: { fontSize: 12, fontWeight: "600", fontFamily: "Sora" },
  paymentFinalLabel: { fontSize: 15, fontWeight: "700", fontFamily: "Sora" },
  paymentFinalValue: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Epilogue",
  },

  /* Delivery Grid */
  sectionHeader: { paddingHorizontal: 4, marginTop: 4 },
  deliveryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  deliveryButton: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    // ACH-004: ensure >= 44×44 per HIG/Material.
    minHeight: 48,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    gap: 6,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  deliveryLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Sora" },

  /* Toggle Cards */
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    gap: 12,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleIconBox: {
    // ACH-004: icon box aligns with 44×44 standard.
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Sora" },
  toggleSubtitle: {
    fontSize: 11,
    fontWeight: "400",
    fontFamily: "Manrope",
    marginTop: 2,
  },

  /* Footer */
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderTopWidth: 0.5,
    shadowColor: "#191C1E",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
});

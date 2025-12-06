import React, { useState, useCallback } from "react";
import {
    Modal,
    View,
    StyleSheet,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ImportQuizModalProps {
    visible: boolean;
    onClose: () => void;
    onImport: (quizData: any) => void;
}

export function ImportQuizModal({
    visible,
    onClose,
    onImport,
}: ImportQuizModalProps) {
    const { theme } = useTheme();
    const [jsonText, setJsonText] = useState("");

    const handleImport = useCallback(() => {
        try {
            const data = JSON.parse(jsonText);

            // Basic validation
            if (!data.title || !Array.isArray(data.questions)) {
                throw new Error("Invalid quiz format");
            }

            onImport(data);
            setJsonText("");
            onClose();
        } catch (error) {
            Alert.alert("Invalid Data", "Please paste a valid quiz JSON string.");
        }
    }, [jsonText, onImport, onClose]);

    const handlePickFile = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/json", "text/html", "*/*"],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            let content = await readAsStringAsync(file.uri);

            // Strip BOM if present
            if (content.charCodeAt(0) === 0xFEFF) {
                content = content.slice(1);
            }

            let data;
            try {
                // Try parsing directly
                data = JSON.parse(content);
            } catch (e) {
                // If direct parse fails, try to find JSON object in content (e.g. if it's HTML)
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        data = JSON.parse(jsonMatch[0]);
                    } catch (e2) {
                        // Failed to parse extracted JSON
                    }
                }
            }

            if (data && data.title && Array.isArray(data.questions)) {
                onImport(data);
                setJsonText("");
                onClose();
            } else {
                throw new Error("Invalid quiz format: Missing title or questions array");
            }
        } catch (error: any) {
            console.error("Import error:", error);
            Alert.alert("Import Failed", `Error: ${error.message}`);
        }
    }, [onImport, onClose]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <View style={[styles.content, { backgroundColor: theme.backgroundRoot }]}>
                    <View style={styles.header}>
                        <ThemedText type="h3">Import Quiz</ThemedText>
                        <Button
                            onPress={onClose}
                            style={{ backgroundColor: "transparent", padding: 0, width: "auto" }}
                        >
                            <Feather name="x" size={24} color={theme.text} />
                        </Button>
                    </View>

                    <Button
                        onPress={handlePickFile}
                        style={{ marginBottom: Spacing.lg, flexDirection: "row", gap: Spacing.sm }}
                    >
                        <Feather name="file" size={20} color="white" />
                        <ThemedText style={{ color: "white", fontWeight: "600" }}>Pick File</ThemedText>
                    </Button>

                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                        <ThemedText style={{ marginHorizontal: Spacing.md, color: theme.textSecondary }}>OR</ThemedText>
                        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                    </View>

                    <ThemedText style={{ marginBottom: Spacing.md, color: theme.textSecondary }}>
                        Paste the quiz code below to import it into your library.
                    </ThemedText>

                    <TextInput
                        value={jsonText}
                        onChangeText={setJsonText}
                        placeholder="Paste JSON code here..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        maxLength={1000000}
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.backgroundDefault,
                                color: theme.text,
                                borderColor: theme.border,
                            },
                        ]}
                    />

                    <Button onPress={handleImport} disabled={!jsonText.trim()}>
                        Import Quiz
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    content: {
        borderTopLeftRadius: BorderRadius.lg,
        borderTopRightRadius: BorderRadius.lg,
        padding: Spacing.lg,
        paddingBottom: Spacing["3xl"],
        maxHeight: "90%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    input: {
        height: 300,
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        textAlignVertical: "top",
    },
});

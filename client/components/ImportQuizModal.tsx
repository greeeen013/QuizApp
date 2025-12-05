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

                    <ThemedText style={{ marginBottom: Spacing.md, color: theme.textSecondary }}>
                        Paste the quiz code below to import it into your library.
                    </ThemedText>

                    <TextInput
                        value={jsonText}
                        onChangeText={setJsonText}
                        placeholder="Paste JSON code here..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
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
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    input: {
        height: 150,
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        textAlignVertical: "top",
    },
});

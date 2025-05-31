import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Action {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
    icon?: keyof typeof Ionicons.glyphMap;
}

interface CustomAlertModalProps {
    visible: boolean;
    title?: string;
    message?: string;
    actions?: Action[];
    onRequestClose?: () => void;
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
    visible,
    title,
    message,
    actions = [{ text: 'OK' }],
    onRequestClose,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onRequestClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Ionicons name="alert-circle" size={40} color="#2196F3" style={{ alignSelf: 'center', marginBottom: 8 }} />
                    {title ? <Text style={styles.title}>{title}</Text> : null}
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                    <View style={styles.actionsRow}>
                        {actions.map((action, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.actionButton,
                                    action.style === 'destructive' && styles.destructiveButton,
                                    action.style === 'cancel' && styles.cancelButton,
                                ]}
                                onPress={action.onPress}
                                activeOpacity={0.8}
                            >
                                {action.icon && (
                                    <Ionicons name={action.icon} size={18} color="#fff" style={{ marginRight: 6 }} />
                                )}
                                <Text style={styles.actionText}>{action.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(30, 41, 59, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    actionButton: {
        backgroundColor: '#2196F3',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 22,
        marginHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    destructiveButton: {
        backgroundColor: '#ef4444',
    },
    cancelButton: {
        backgroundColor: '#64748b',
    },
    actionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CustomAlertModal;

import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface DatePickerProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    disableFutureDates?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
    selectedDate,
    onDateChange,
    disableFutureDates = false,
}) => {
    const [showPicker, setShowPicker] = React.useState(false);
    const [tempDate, setTempDate] = React.useState<Date | null>(null);
    const [selectedMonthYear, setSelectedMonthYear] = React.useState(new Date());

    React.useEffect(() => {
        // Update selectedMonthYear when picker opens
        if (showPicker) {
            setSelectedMonthYear(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        }
    }, [showPicker]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const generateDateRange = (start: Date, end: Date) => {
        const dates: Date[] = [];
        let currentDate = new Date(start);
        currentDate.setDate(1); // Start from the 1st of the month

        while (currentDate <= end) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const generateMonthYearRange = () => {
        const months = [];
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
        const endDate = disableFutureDates
            ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        let currentMonth = new Date(startDate);
        while (currentMonth <= endDate) {
            months.push(new Date(currentMonth));
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
        console.log(months);

        return months;
    };

    const isSelectedDate = (date: Date, selected: Date) => {
        return date.toDateString() === selected.toDateString();
    };

    const isDateDisabled = (date: Date) => {
        if (disableFutureDates) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date > today;
        }
        return false;
    };

    const renderDatePicker = () => {
        const currentDate = tempDate || selectedDate;
        const monthYearRange = generateMonthYearRange();
        const daysInMonth = generateDateRange(
            new Date(selectedMonthYear.getFullYear(), selectedMonthYear.getMonth(), 1),
            new Date(selectedMonthYear.getFullYear(), selectedMonthYear.getMonth() + 1, 0)
        );

        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={true}
                onRequestClose={() => setShowPicker(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowPicker(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Select Date</Text>
                            <TouchableOpacity
                                disabled={true}
                                style={{ display: 'none' }}
                                onPress={() => {
                                    if (tempDate) {
                                        onDateChange(tempDate);
                                    }
                                    setTempDate(null);
                                    setShowPicker(false);
                                }}
                            >
                                <Text style={styles.doneButton}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            style={styles.monthYearPicker}
                            showsHorizontalScrollIndicator={false}
                        >
                            {monthYearRange.map((date, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.monthYearButton,
                                        date.getMonth() === selectedMonthYear.getMonth() &&
                                        date.getFullYear() === selectedMonthYear.getFullYear() &&
                                        styles.selectedMonthYear
                                    ]}
                                    onPress={() => setSelectedMonthYear(date)}
                                >
                                    <Text style={[
                                        styles.monthYearText,
                                        date.getMonth() === selectedMonthYear.getMonth() &&
                                        date.getFullYear() === selectedMonthYear.getFullYear() &&
                                        styles.selectedMonthYearText
                                    ]}>
                                        {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.calendar}>
                            <View style={styles.weekDays}>
                                {weekDays.map((day, index) => (
                                    <Text key={index} style={styles.weekDayText}>{day}</Text>
                                ))}
                            </View>

                            <View style={styles.daysGrid}>
                                {Array(daysInMonth[0].getDay()).fill(null).map((_, index) => (
                                    <View key={`empty-${index}`} style={styles.dayCell} />
                                ))}

                                {daysInMonth.map((date, index) => {
                                    const disabled = isDateDisabled(date);
                                    const isSelected = isSelectedDate(date, currentDate);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.dayCell,
                                                isSelected && styles.selectedDay,
                                                disabled && styles.disabledDay
                                            ]}
                                            onPress={() => {
                                                //  && setTempDate(date)
                                                if (date) {
                                                    !disabled && onDateChange(date);
                                                }
                                                setTempDate(null);
                                                setShowPicker(false);
                                            }}
                                            disabled={disabled}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                isSelected && styles.selectedDayText,
                                                disabled && styles.disabledDayText
                                            ]}>
                                                {date.getDate()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                    setTempDate(null);
                    setShowPicker(true);
                }}
            >
                <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>

            {showPicker && renderDatePicker()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },
    dateButton: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dateButtonText: {
        fontSize: 14,
        color: '#1a1a1a',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingInline: 6,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginHorizontal: "auto",
    },
    doneButton: {
        fontSize: 16,
        color: '#2196F3',
        fontWeight: '600',
    },
    monthYearPicker: {
        flexGrow: 0,
        marginBottom: 16,
    },
    monthYearButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
    },
    selectedMonthYear: {
        backgroundColor: '#2196F3',
    },
    monthYearText: {
        fontSize: 14,
        color: '#666',
    },
    selectedMonthYearText: {
        color: '#fff',
    },
    calendar: {
        backgroundColor: '#fff',
    },
    weekDays: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekDayText: {
        fontSize: 12,
        color: '#666',
        width: 40,
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 14,
        marginBlock: "auto",
        color: '#1a1a1a',
    },
    selectedDay: {
        backgroundColor: '#2196F3',
        borderRadius: 40,
    },
    selectedDayText: {
        color: '#ffffff',
        fontWeight: '700',
    },
    disabledDay: {
        opacity: 0.4,
    },
    disabledDayText: {
        color: '#999',
    },
});

export default DatePicker; 
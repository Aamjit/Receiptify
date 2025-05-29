import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface DateRangePickerProps {
    startDate?: Date;
    endDate?: Date;
    onStartDateChange: (date: Date) => void;
    onEndDateChange: (date: Date) => void;
    disableFutureDates?: boolean;
    maxRangeNumberOfDays?: number;
    /**
     * Callback for error messages, e.g., when the selected end date is before the start date.
     * @param message The error message to display.
     */
    onError?: (message: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    startDate: propStartDate,
    endDate: propEndDate,
    onStartDateChange,
    onEndDateChange,
    disableFutureDates = false,
    maxRangeNumberOfDays: propMaxRangeNumberOfDays,
    onError,
}) => {
    const defaultDate = new Date();
    const [showStartPicker, setShowStartPicker] = React.useState(false);
    const [showEndPicker, setShowEndPicker] = React.useState(false);
    const [tempDate, setTempDate] = React.useState<Date | null>(null);
    const [selectedMonthYear, setSelectedMonthYear] = React.useState(new Date());

    const startDate = propStartDate || defaultDate;
    const endDate = propEndDate || defaultDate;

    React.useEffect(() => {
        // Update selectedMonthYear when picker opens
        if (showStartPicker) {
            setSelectedMonthYear(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
        } else if (showEndPicker) {
            setSelectedMonthYear(new Date(endDate.getFullYear(), endDate.getMonth(), 1));
        }
    }, [showStartPicker, showEndPicker]);

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
        // const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
        const endDate = disableFutureDates
            ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            : new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1);

        let currentMonth = new Date(startDate);
        while (currentMonth <= endDate) {
            months.push(new Date(currentMonth));
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
        return months;
    };

    const isSelectedDate = (date: Date, selectedDate: Date) => {
        return date.toDateString() === selectedDate.toDateString();
    };

    const isDateInRange = (date: Date) => {
        // If start and end dates are the same, check if the date matches
        if (startDate.toDateString() === endDate.toDateString()) {
            return date.toDateString() === startDate.toDateString();
        }
        // Otherwise check if date is between start and end (inclusive)
        return date >= startDate && date <= endDate;
    };

    const isStartOrEndDate = (date: Date) => {
        return date.toDateString() === startDate.toDateString() ||
            date.toDateString() === endDate.toDateString();
    };

    const isDateDisabled = (date: Date) => {
        if (disableFutureDates) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date > today;
        }
        return false;
    };

    const checkRangeValidation = (date: Date, isEndDate: boolean) => {
        if (isEndDate) {
            if (date < startDate) {
                onError?.("End date cannot be before start date");
                return false;
            }
        } else {
            if (date > endDate) {
                onError?.("Start date cannot be after end date");
                return false;
            }
        }

        if (!propMaxRangeNumberOfDays) {
            return true;
        }

        let newStartDate = startDate;
        let newEndDate = endDate;

        if (isEndDate) {
            newEndDate = date;
        } else {
            newStartDate = date;
        }

        const rangeInDays = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 3600 * 24));

        if (rangeInDays > propMaxRangeNumberOfDays) {
            onError?.(`Cannot select a range longer than ${propMaxRangeNumberOfDays} days`);
            return false;
        }
        return true;
    }

    const handleDateSelection = (date: Date, isEndDate: boolean) => {
        if (!checkRangeValidation(date, isEndDate)) {
            return;
        }
        if (isEndDate) {
            onEndDateChange(date);
            setShowEndPicker(false);
        } else {
            onStartDateChange(date);
            setShowStartPicker(false);
        }
        setTempDate(null);
    }

    const renderDatePicker = (selectedDate: Date, onSelect: (date: Date) => void, onClose: () => void, isEndDate: boolean = false) => {
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
                onRequestClose={onClose}
            >
                <Pressable style={styles.modalOverlay} onPress={onClose}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Select {isEndDate ? "End" : "Start"} Date</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (tempDate) {
                                        handleDateSelection(tempDate, isEndDate);
                                    } else {
                                        onClose();
                                    }
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
                                    const inRange = isDateInRange(date);
                                    const isStartEnd = isStartOrEndDate(date);
                                    const isSelected = isSelectedDate(date, currentDate);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.dayCell,
                                                inRange && styles.dateInRange,
                                                isStartEnd && styles.startEndDate,
                                                isSelected && styles.selectedDay,
                                                disabled && styles.disabledDay
                                            ]}
                                            onPress={() => !disabled && checkRangeValidation(date, isEndDate) && setTempDate(date)}
                                            disabled={disabled}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                inRange && styles.dateInRangeText,
                                                isStartEnd && styles.startEndDateText,
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
            <View style={styles.datePickerRow}>
                <Text style={styles.dateLabel}>From:</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                        setTempDate(null);
                        setShowStartPicker(true);
                    }}
                >
                    <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>

            </View>
            <View style={styles.datePickerRow}>
                <Text style={styles.dateLabel}>To:</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                        setTempDate(null);
                        setShowEndPicker(true);
                    }}
                >
                    <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>

            </View>

            {showStartPicker && renderDatePicker(
                startDate,
                onStartDateChange,
                () => setShowStartPicker(false),
                false
            )}
            {showEndPicker && renderDatePicker(
                endDate,
                onEndDateChange,
                () => setShowEndPicker(false),
                true
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    datePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateLabel: {
        fontSize: 14,
        color: '#666',
        width: 50,
    },
    dateButton: {
        backgroundColor: '#f8f9fa',
        flex: 1,
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
    dateInRange: {
        backgroundColor: '#E3F2FD',
    },
    dateInRangeText: {
        color: '#1976D2',
        fontWeight: '500',
    },
    startEndDate: {
        backgroundColor: '#2196F3',
        borderRadius: 40,
    },
    startEndDateText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    selectedDay: {
        backgroundColor: '#E5A600',
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

export default DateRangePicker; 
import { View, Text, Platform } from 'react-native'
import React, { useState } from 'react'

interface DateTimePickerProps {
    value: Date;
    mode: 'date' | 'time' | 'datetime';
    display: 'default' | 'spinner' | 'calendar';
    // onChange: (event: DateTimePickerEvent, date?: Date) => void;
}

export default DateTimePicker = ({ props: DateTimePickerProps }) => {
    if (Platform.OS === 'ios') {
        return (
            <View>
                <Text>DateTimePicker</Text>
            </View>
        )
    }

    if (Platform.OS === 'android') {
        return <AndroidDateTimePicker props={props} />
    }

    return null
}


export const AndroidDateTimePicker = ({ props: DateTimePickerProps }) => {
    const [date, setDate] = useState(new Date())
    const [mode, setMode] = useState<'date' | 'time' | 'datetime'>('date')
    const [isVisible, setIsVisible] = useState(false)

    const showPicker = () => {
        setIsVisible(true)
    }

    const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
        if (date) {
            setDate(date)
            props.onChange(event, date)
        }
    }


}
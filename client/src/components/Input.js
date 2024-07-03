import { TextInput, Checkbox } from "../styles/Input";
import { FormControlLabel } from "@mui/material";

export default function Input({ type, id, label, value, onChange, required = true }) {
    return (
        type === 'text' ?
        <TextInput
            id={id}
            label={label}
            value={value}
            onChange={onChange}
            InputLabelProps={{ required: false }}
            variant="outlined"
            fullWidth
            required={required}
        />
        :
        type === 'checkbox' ?
        <FormControlLabel 
            label={label}
            control={
                <Checkbox
                    id={id}
                    checked={value}
                    onChange={onChange}
                    variant="outlined"
                />
            }
        />
        :
        type === 'textarea' ?
        <TextInput 
            id={id}
            label={label}
            value={value}
            onChange={onChange}
            InputLabelProps={{ required: false }}
            variant="outlined"
            fullWidth
            multiline
            minRows={3}
            maxRows={3}
            required={required}
        />
        :
        <TextInput 
            id={id}
            label={label}
            value={value}
            onChange={onChange}
            InputLabelProps={{ required: false }}
            variant="outlined"
            fullWidth
            required
            inputProps={{
                type: 'number',
                min: 0
            }}
        />
    );
}

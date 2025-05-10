import { TextInput, Checkbox, Color, Radio } from "../styles/Input";
import { FormControlLabel, Radio as RD } from "@mui/material";
import cuid from "cuid";

export default function Input({ type, id, label, value, radioOptions = [], onChange, required = true }) {
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
        type === 'color' ?
        <div
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
            <label htmlFor={id}>{label}</label>
            <Color
                type="color"
                className="color-input"
                id={id}
                value={value}
                onChange={onChange}
                required={required}
            />
        </div>
        :
        type === 'radio' ?
        <div
            
        >
            {label}
            <Radio
                value={value ?? ''}
                onChange={onChange}
                row
            >
                {
                    radioOptions.map(option => (
                        <FormControlLabel
                            value={option.value ?? ''}
                            label={option.label}
                            control={<RD />}
                            key={cuid()}
                        />
                    ))
                }
            </Radio>
        </div>
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

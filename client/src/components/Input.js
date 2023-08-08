import { TextInput } from "../styles/Input";

export default function Input({ type, id, label, value, onChange }) {
    return (
        <TextInput
            id={id}
            label={label}
            value={value}
            onChange={onChange}
            InputLabelProps={{ required: false }}
            variant="outlined"
            fullWidth
            required
        />
    );
}

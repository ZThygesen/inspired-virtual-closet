import { StyleProfileContainer } from '../styles/StyleProfile';

export default function StyleProfile({ display }) {
    return (
        <StyleProfileContainer style={{ display: display ? 'flex' : 'none' }}>
            Style
        </StyleProfileContainer>
    );
}

import { OutfitsWornContainer } from "../styles/OutfitsWorn";

export default function OutfitsWorn({ display }) {
    return (
        <OutfitsWornContainer style={{ display: display ? 'flex' : 'none' }}>
            Outfits Worn
        </OutfitsWornContainer>
    );
}
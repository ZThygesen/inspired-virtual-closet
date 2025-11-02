import { InPersonStylingContainer } from '../styles/InPersonStyling';
// import ReactGoogleSlides from 'react-google-slides';
 
export default function InPersonStyling({ display }) {
    return (
        
        <InPersonStylingContainer style={{ display: display ? 'flex' : 'none' }}>
            In Person Styling
            {/* <a href="https://docs.google.com/presentation/d/1uACkJSk6r9endxws3yB3lde0moQtjs1d/edit?usp=sharing&ouid=105966789073800159650&rtpof=true&sd=true">
                <ReactGoogleSlides
                    width={640}
                    height={480}
                    slidesLink="https://docs.google.com/presentation/d/1uACkJSk6r9endxws3yB3lde0moQtjs1d/edit?usp=sharing&ouid=105966789073800159650&rtpof=true&sd=true"
                    slideDuration={5}
                    position={1}
                    showControls
                    loop
                />
            </a> */}
        </InPersonStylingContainer>
        
    );
}
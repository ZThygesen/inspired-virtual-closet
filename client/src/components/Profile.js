import { useEffect, useRef, useState } from 'react';
import { useError } from './ErrorContext';
import api from '../api';
import Loading from './Loading';
import cuid from 'cuid';
import Modal from './Modal';
import { useUser } from './UserContext';
import { useClient } from './ClientContext';
import { ProfileContainer } from '../styles/Profile';
import { Tooltip } from '@mui/material';
import StyleProfile from './StyleProfile';
import Inspo from './Inspo';
import InPersonStyling from './InPersonStyling';
import Tips from './Tips';
import OutfitsWorn from './OutfitsWorn';

export default function Profile({ display }) {
    const { setError } = useError();

    const [profileMode, setProfileMode] = useState(0);
    const [showIcons, setShowIcons] = useState(false);
    const [loading, setLoading] = useState(false);

    const { user } = useUser();
    const { client } = useClient();

    const ref = useRef();
    
    function scrollToRef(ref) {
        ref.current.scroll({
            top: 0,
            behavior: 'smooth'
        });
    }

    const profileModes = [
        { name: 'Style', icon: '' },
        { name: 'Inspo', icon: '' },
        { name: 'In Person Styling', icon: '' },
        { name: 'Tips', icon: '' },
        { name: 'Outfits Worn', icon: '' },
    ];

    return (
        <>
            <ProfileContainer style={{ display: display ? 'flex' : 'none' }}>
                <h2 className="profile-title">Profile</h2>
                <div className="profile-options">
                    <ul>
                        {
                            profileModes.map((mode, index) => (
                                <li key={cuid()} className={index === profileMode ? 'active' : ''}>
                                    <button
                                        className={index === profileMode ? 'profile-button active' : 'profile-button'}
                                        onClick={() => setProfileMode(index)}
                                    >
                                        {showIcons ?
                                            <Tooltip title={mode.name}>
                                                <p className="material-icons profile-mode-icon">{mode.icon}</p>
                                            </Tooltip>
                                            :
                                            <p className="profile-mode-text">{mode.name}</p>
                                        }
                                    </button>
                                </li>
                            ))
                        }
                    </ul>
                </div>
                <div ref={ref} className="profile-container">
                    <StyleProfile 
                        display={profileMode === 0}
                    />
                    <Inspo 
                        display={profileMode === 1}         
                    />
                    <InPersonStyling 
                        display={profileMode === 2}
                    />
                    <Tips 
                        display={profileMode === 3}
                    />
                    <OutfitsWorn
                        display={profileMode === 4}
                    />
                </div>
            </ProfileContainer>
        </>
        
    );
}

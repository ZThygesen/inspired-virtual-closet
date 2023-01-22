import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Tooltip } from '@mui/material';  
import { Checkroom, Delete, Edit } from '@mui/icons-material';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    box-shadow: var(--box-shadow);
    border-radius: 25px;
    padding: 40px 20px;
    background-color: var(--white);
    height: min-content;
    max-width: 300px;

    p {
        font-family: 'Fashion';
        font-size: 40px;
        font-weight: bold;
        word-break: break-word;
        text-align: center;
    }

    .client-options {
        display: flex;
        align-items: flex-end;
    }

    .client-option-btn {
        padding: 5px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;
        color: #a7a7a7;

        &:hover {
            background-color: rgba(0, 0, 0, 0.1);
            color: var(--black);
        }
    }

    .client-option-btn.large {
        color: var(--secondary);
    }
`

export default function ClientCard({ client, editClient, deleteClient }) {
    const navigate = useNavigate();

    return (
        <Container>
            <p>{`${client.firstName} ${client.lastName}`}</p>
            <div className="client-options">
                <Tooltip title="Edit">
                    <Edit onClick={() => editClient(client)} sx={{ fontSize: 45 }} className="client-option-btn" />
                </Tooltip>
                <Tooltip title="Digital Closet">
                    <Checkroom
                        className="client-option-btn large"
                        sx={{ fontSize: 75 }}
                        onClick={() => navigate(`${client.firstName.toLowerCase()}-${client.lastName.toLowerCase()}`, { state: { client: client } })}
                    />
                </Tooltip>
                <Tooltip title="Delete">
                    <Delete onClick={() => deleteClient(client)} sx={{ fontSize: 45 }} className="client-option-btn" />
                </Tooltip>
            </div>
        </Container>
    );
}

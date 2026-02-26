import React from 'react';
import { IconButton } from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CloseIcon from '@mui/icons-material/Close';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';

const ScreenSharePanel = ({ 
    isMaximized, 
    onToggleSize, 
    onClose, 
    screenShareUser, 
    children 
}) => {
    const panelStyle = {
        position: 'fixed',
        top: isMaximized ? '0' : '80px',
        left: isMaximized ? '0' : '20px',
        right: isMaximized ? '0' : 'auto',
        bottom: isMaximized ? '0' : 'auto',
        width: isMaximized ? '100vw' : '300px',
        height: isMaximized ? '100vh' : '200px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: isMaximized ? '0' : '8px',
        border: isMaximized ? 'none' : '2px solid #4CAF50',
        zIndex: isMaximized ? 1001 : 999,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
    };

    const headerStyle = {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        minHeight: '32px'
    };

    const videoStyle = {
        width: '100%',
        height: 'calc(100% - 32px)',
        objectFit: 'cover',
        backgroundColor: '#000'
    };

    return (
        <div style={panelStyle}>
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ScreenShareIcon fontSize="small" />
                    <span>{screenShareUser === 'You' ? 'You are sharing' : `${screenShareUser} sharing`}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                    <IconButton 
                        size="small" 
                        onClick={onToggleSize}
                        style={{ color: 'white', padding: '4px' }}
                    >
                        {isMaximized ? <MinimizeIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
                    </IconButton>
                    
                    {screenShareUser === 'You' && (
                        <IconButton 
                            size="small" 
                            onClick={onClose}
                            style={{ color: '#f44336', padding: '4px' }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )}
                </div>
            </div>
            
            <div style={videoStyle}>
                {children}
            </div>
        </div>
    );
};

export default ScreenSharePanel;
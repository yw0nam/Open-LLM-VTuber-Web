export const canvasStyles = {
  background: {
    container: {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      pointerEvents: 'auto'
    },
    image: {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: 1
    }
  },
  canvas: {
    container: {
      position: 'relative',
      width: '100%',
      height: '100%',
      zIndex: '1',
      pointerEvents: 'auto'
    }
  },
  subtitle: {
    container: {
      position: 'absolute',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '15px 30px',
      borderRadius: '12px',
      minWidth: '60%',
      maxWidth: '95%',
      zIndex: 2
    },
    text: {
      color: 'white',
      fontSize: '1.5rem',
      textAlign: 'center',
      lineHeight: '1.4',
      whiteSpace: 'pre-wrap'
    }
  },
  wsStatus: {
    container: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 2,
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 'medium',
      color: 'white',
      transition: 'all 0.2s',
      variants: {
        connected: {
          backgroundColor: 'green.500'
        },
        disconnected: {
          backgroundColor: 'red.500'
        },
        connecting: {
          backgroundColor: 'yellow.500'
        }
      }
    }
  }
}

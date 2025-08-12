import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #333333 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.3,
          }}
        />
        
        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              width: 120,
              height: 120,
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
              color: 'black',
              borderRadius: '20%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 'bold',
              marginBottom: 40,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            WV
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              margin: 0,
              marginBottom: 20,
              background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              textAlign: 'center',
            }}
          >
            Website Viewer
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 32,
              color: '#cccccc',
              margin: 0,
              marginBottom: 40,
              textAlign: 'center',
              maxWidth: 800,
            }}
          >
            View websites in different device sizes - desktop, tablet, and mobile
          </p>

          {/* Device Icons */}
          <div
            style={{
              display: 'flex',
              gap: 30,
              alignItems: 'center',
              opacity: 0.8,
            }}
          >
            {/* Desktop */}
            <div
              style={{
                width: 60,
                height: 40,
                border: '3px solid #ffffff',
                borderRadius: 6,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 3,
                  background: '#ffffff',
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              />
            </div>

            {/* Tablet */}
            <div
              style={{
                width: 40,
                height: 55,
                border: '3px solid #ffffff',
                borderRadius: 8,
              }}
            />

            {/* Mobile */}
            <div
              style={{
                width: 30,
                height: 50,
                border: '3px solid #ffffff',
                borderRadius: 8,
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
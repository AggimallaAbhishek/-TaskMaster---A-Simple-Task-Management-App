import React from 'react';
import { COLORS } from '../styles/theme';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            hasError: true,
            error,
            errorInfo,
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: '20px',
                        maxWidth: '600px',
                        margin: '100px auto',
                        backgroundColor: COLORS.BG_ERROR,
                        border: `2px solid ${COLORS.DANGER}`,
                        borderRadius: '8px',
                        color: COLORS.BG_ERROR_DARK,
                    }}
                >
                    <h2>Something went wrong 😞</h2>
                    <p>{this.state.error?.toString()}</p>
                    <details
                        style={{
                            whiteSpace: 'pre-wrap',
                            marginTop: '20px',
                            cursor: 'pointer',
                        }}
                    >
                        <summary>Error details</summary>
                        {this.state.errorInfo?.componentStack}
                    </details>
                    <button
                        onClick={() =>
                            this.setState({
                                hasError: false,
                                error: null,
                                errorInfo: null,
                            })
                        }
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            backgroundColor: COLORS.DANGER,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

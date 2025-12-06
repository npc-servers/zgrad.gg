/**
 * Reusable Button Component
 */

export function Button({ 
    children, 
    variant = 'secondary', 
    size = 'md',
    icon,
    onClick, 
    disabled = false,
    type = 'button',
    className = '',
    ...props 
}) {
    const baseClass = 'cms-btn';
    const variantClass = variant === 'primary' ? 'cms-btn-primary' : 
                        variant === 'danger' ? 'cms-btn-danger' : 
                        'cms-btn-secondary';
    
    const colorClass = props.color ? `cms-btn-${props.color}` : '';
    const sizeClass = size === 'sm' ? 'cms-btn-sm' : '';
    
    const classes = [baseClass, variantClass, colorClass, sizeClass, className]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            type={type}
            className={classes}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {icon && icon}
            {children}
        </button>
    );
}


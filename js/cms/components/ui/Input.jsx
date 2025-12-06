/**
 * Reusable Input Component
 */

export function Input({ 
    label, 
    hint,
    value, 
    onChange, 
    placeholder = '',
    type = 'text',
    required = false,
    className = '',
    ...props 
}) {
    return (
        <div className="cms-form-group">
            {label && (
                <label className="cms-label">
                    {label}
                    {hint && <span className="cms-label-hint"> {hint}</span>}
                </label>
            )}
            <input
                type={type}
                className={`cms-input ${className}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                {...props}
            />
        </div>
    );
}

export function Textarea({ 
    label, 
    hint,
    value, 
    onChange, 
    placeholder = '',
    rows = 3,
    required = false,
    className = '',
    ...props 
}) {
    return (
        <div className="cms-form-group">
            {label && (
                <label className="cms-label">
                    {label}
                    {hint && <span className="cms-label-hint"> {hint}</span>}
                </label>
            )}
            <textarea
                className={`cms-textarea ${className}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                required={required}
                {...props}
            />
        </div>
    );
}

export function Select({ 
    label, 
    hint,
    value, 
    onChange, 
    options = [],
    className = '',
    ...props 
}) {
    return (
        <div className="cms-form-group">
            {label && (
                <label className="cms-label">
                    {label}
                    {hint && <span className="cms-label-hint"> {hint}</span>}
                </label>
            )}
            <select
                className={`cms-editor-select ${className}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                {...props}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}


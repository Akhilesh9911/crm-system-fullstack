import { Search } from 'lucide-react'

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  inputClassName = '',
  iconClassName = '',
  rightSlot = null,
  ...props
}) {
  return (
    <div className={`search-input-wrapper ${className}`.trim()}>
      <Search size={15} className={`search-input-icon ${iconClassName}`.trim()} />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`search-input-field ${inputClassName}`.trim()}
        {...props}
      />
      {rightSlot}
    </div>
  )
}

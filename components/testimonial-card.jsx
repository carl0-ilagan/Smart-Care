export function TestimonialCard({ name, role, testimonial, avatarSrc }) {
  return (
    <div className="flex flex-col rounded-lg border border-earth-beige bg-white p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-drift-gray">"{testimonial}"</p>
      </div>
      <div className="mt-auto flex items-center">
        <div className="mr-3 h-10 w-10 overflow-hidden rounded-full">
          <img src={avatarSrc || "/placeholder.svg"} alt={name} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="font-medium text-graphite">{name}</p>
          <p className="text-sm text-drift-gray">{role}</p>
        </div>
      </div>
    </div>
  )
}

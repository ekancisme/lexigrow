import GrowthGardenWidget from '../../components/student/GrowthGardenWidget.jsx'

// The full garden route is lazy-loaded, while MyProgress uses the shared
// widget directly. Keeping the route wrapper separate avoids an ineffective
// dynamic import and preserves a single garden implementation.
export default function GrowthGardenPage() {
  return <GrowthGardenWidget />
}

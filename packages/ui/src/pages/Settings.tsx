import { Box } from '@mui/material'
import WatchedAccounts from '../components/WatchedAccounts'

interface Props {
  className?: string
}

const Settings = ({ className }: Props) => {
  return (
    <Box className={className}>
      <h3>Watched Accounts</h3>
      <WatchedAccounts />
    </Box>
  )
}

export default Settings

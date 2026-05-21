import electronLogo from './assets/electron.svg'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@renderer/components/ui/card'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <h1 className="text-3xl font-bold underline text-amber-300 mb-8">
        Hello world111!
      </h1>

      <div className="flex flex-col items-center gap-8">
        <img alt="logo" className="logo" src={electronLogo} />
        
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Electron + React + TypeScript</CardTitle>
            <CardDescription>Powered by electron-vite</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              Build an Electron app with <span className="react">React</span>
              &nbsp;and <span className="ts">TypeScript</span>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Please try pressing <code>F12</code> to open the devTool
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
                Documentation
              </a>
            </Button>
            <Button onClick={ipcHandle}>
              Send IPC
            </Button>
          </CardFooter>
        </Card>

        <div className="actions">
          <div className="action">
            <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
              Documentation
            </a>
          </div>
          <div className="action">
            <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
              Send IPC
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default App

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { toast } from 'react-hot-toast'

export default function HelpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  /**
   * 
   @description submitting the form is not implemented yet,only the design is implemented for now.
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    // reset the form fields
    setName("")
    setEmail("")
    setMessage("")
    toast.success('Your message has been sent!')
  }

  return (
    <div className="container mt-40 py-8">
      <h1 className="text-3xl font-bold mb-6">Help & Support</h1>
      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
          <CardDescription>Fill out the form below to get in touch with our support team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="name"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="email"
                  placeholder="Your Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Textarea
                  id="message"
                  placeholder="Your Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
              />
              </div>
            </div>


            <CardFooter className="flex justify-between mt-4 px-0">
              <Button type="submit">Send Message</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


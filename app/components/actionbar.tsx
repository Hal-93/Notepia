import { useState } from "react";
import { Form } from "@remix-run/react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";


export default function ActionBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-4 right-5 z-10">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition"
            style={{ height: "4rem", width: "4rem" }}
          >
            {isOpen ? "✖" : "☰"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-4 space-y-2">
          <Form action="/logout" method="post">
            <Button className="w-full">ログアウト</Button>
          </Form>
        </PopoverContent>
      </Popover>
    </div>
  );
}

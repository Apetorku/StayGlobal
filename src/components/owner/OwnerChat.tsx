
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, Zap } from "lucide-react";

const OwnerChat = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Guest Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-full text-center space-y-6">
          <div className="bg-blue-50 p-6 rounded-full">
            <Zap className="h-12 w-12 text-blue-600" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">
              Real-time Chat Coming Soon!
            </h3>
            <p className="text-gray-600 max-w-md">
              We're building an integrated messaging system to help you communicate
              directly with your guests in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Expected release: Q2 2024</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg max-w-md">
            <h4 className="font-medium text-gray-900 mb-2">Planned Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time messaging with guests</li>
              <li>• Automated check-in instructions</li>
              <li>• Support ticket system</li>
              <li>• Message templates</li>
              <li>• Mobile notifications</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default OwnerChat;

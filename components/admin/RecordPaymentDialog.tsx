'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminKeys } from '@/lib/api/admin';
import {
  createAdminPayment,
  paymentKeys,
  type PaymentParent,
} from '@/lib/api/payments';
import { displaySubject, type Child, type PaymentGateway, type PaymentPlan } from '@/lib/types';

export default function RecordPaymentDialog({
  parents,
  students,
  initialParentId,
  initialStudentId,
  open: controlledOpen,
  onOpenChange,
  triggerLabel = 'Record payment',
  showTrigger = true,
}: {
  parents: PaymentParent[];
  students: Child[];
  initialParentId?: string;
  initialStudentId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel?: string;
  showTrigger?: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [parentId, setParentId] = useState(
    initialParentId || parents[0]?.id || '',
  );
  const parentChildren = useMemo(
    () => students.filter((child) => child.parentId === parentId),
    [parentId, students],
  );
  const [studentId, setStudentId] = useState(initialStudentId ?? '');
  const selectedStudent = parentChildren.find((child) => child.id === studentId);
  const subjects = useMemo(
    () => {
      if (!selectedStudent?.intake) return [];
      return Array.from(new Set(displaySubject(selectedStudent.intake).split(', ')));
    },
    [selectedStudent],
  );
  const subjectKey = subjects.join('|');
  const [subject, setSubject] = useState('');
  const [plan, setPlan] = useState<PaymentPlan>('Starter Bundle');
  const [gateway, setGateway] = useState<PaymentGateway>('Stripe');
  const [amount, setAmount] = useState('150');
  const [sessionsIncluded, setSessionsIncluded] = useState('5');

  useEffect(() => {
    if (!open) return;
    setParentId(initialParentId || parents[0]?.id || '');
    setStudentId(initialStudentId ?? '');
  }, [initialParentId, initialStudentId, open, parents]);

  useEffect(() => {
    setSubject(subjects[0] ?? '');
  }, [studentId, subjectKey, subjects]);

  const mutation = useMutation({
    mutationFn: createAdminPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: paymentKeys.adminPayments });
      await queryClient.invalidateQueries({
        queryKey: paymentKeys.adminLessonPackages,
      });
      await queryClient.invalidateQueries({ queryKey: adminKeys.students });
      setOpen(false);
      toast({
        title: 'Payment recorded',
        description: 'The family can now see this payment.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not record payment',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-brand hover:bg-brand-600 rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record parent payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Parent</Label>
            <Select
              value={parentId}
              onValueChange={(value) => {
                setParentId(value);
                setStudentId('');
                setSubject('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent" />
              </SelectTrigger>
              <SelectContent>
                {parents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Student</Label>
            <Select
              value={studentId}
              onValueChange={(value) => setStudentId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {parentChildren.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Plan</Label>
              <Select
                value={plan}
                onValueChange={(value) => setPlan(value as PaymentPlan)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single Session">Single Session</SelectItem>
                  <SelectItem value="Starter Bundle">Starter Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Gateway</Label>
              <Select
                value={gateway}
                onValueChange={(value) => setGateway(value as PaymentGateway)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stripe">Stripe</SelectItem>
                  <SelectItem value="Flutterwave">Flutterwave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sessions included</Label>
              <Input
                type="number"
                min="1"
                value={sessionsIncluded}
                onChange={(event) => setSessionsIncluded(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-brand hover:bg-brand-600"
            disabled={!parentId || !studentId || !subject || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                parentId,
                studentId,
                subject,
                plan,
                gateway,
                amount: Number(amount),
                sessionsIncluded: Number(sessionsIncluded),
              })
            }
          >
            {mutation.isPending ? 'Recording...' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

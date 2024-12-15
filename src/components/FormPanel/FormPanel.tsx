import { Box, Typography, Stack, TextField, Button } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import useAxios from '../../hooks/useAxios';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeader } from '../../utils/utils';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface FormPanelProps {
  formID?: string;
}

type Question = {
  id: string;
  question: string;
};

type FormResponse = {
  link: string;
  title: string;
  closingTime: string;
  userEmail: string;
  questions: Question[];
};

type Answer = {
  questionId: string;
  answer: string;
};

export const FormPanel = ({ formID }: FormPanelProps) => {
  const { axiosRequest } = useAxios();
  const [formData, setFormData] = useState<FormResponse | null>(null);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false); // Added

  const FormSchema = z.object({
    answers: z.array(
      z.object({
        answer: z.string().min(1, { message: 'Answer cannot be empty.' }),
      })
    ),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<{ answers: Answer[] }>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      answers: [],
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await axiosRequest(
          'GET',
          `forms/${formID}`,
          undefined,
          getAuthHeader()
        );
        const data = response?.data;
        setFormData(data);

        const defaultAnswers = data.questions.map((q: Question) => ({
          questionId: q.id,
          answer: '',
        }));
        setValue('answers', defaultAnswers);
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data || 'Failed to load form.');
        } else {
          toast.error('Failed to load form.');
        }
      }
    };

    if (formID) {
      fetchForm();
    }
  }, [formID, axiosRequest, setValue]);

  const onSubmit = async (data: { answers: { answer: string }[] }) => {
    try {
      // Reconstruct the answers array to include questionId
      const answersWithIds = data.answers.map((answerObj, index) => ({
        questionId: formData!.questions[index].id,
        answer: answerObj.answer,
      }));

      const payload = {
        userEmail: 'string', // Replace with user's email if necessary
        answers: answersWithIds,
      };

      await axiosRequest('POST', `forms/${formID}`, payload, getAuthHeader());
      toast.success('Form submitted successfully!');
      setIsFormSubmitted(true); // Added
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data || 'Failed to submit form.');
      } else {
        toast.error('Failed to submit form.');
      }
    }
  };

  if (!formData) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography>Loading form...</Typography>
      </Box>
    );
  }

  if (isFormSubmitted) {
    // Success message after form submission
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
          Your responses have been submitted successfully!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href="/"
          sx={{ mt: 2, px: 8 }}
        >
          Go to Home Page
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: 3,
      }}
    >
      <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
        {formData.title}
      </Typography>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ width: { xs: '75%', md: '50%' } }}
      >
        <Stack spacing={3}>
          {formData.questions.map((question, index) => (
            <Box key={question.id}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {index + 1}. {question.question}
              </Typography>
              <Controller
                name={`answers.${index}.answer`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    required
                    error={Boolean(errors.answers?.[index]?.answer)}
                    helperText={errors.answers?.[index]?.answer?.message}
                  />
                )}
              />
            </Box>
          ))}
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ mt: 2, px: 8 }}
          >
            Submit
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
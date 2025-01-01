import { useMemo } from 'react'
import {
  Stack,
  Input,
  createListCollection
} from '@chakra-ui/react'
import {
  NumberInputField,
  NumberInputRoot,
} from "@/components/ui/number-input"
import { SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItem } from '@/components/ui/select'
import { Field } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { settingStyles } from './setting-styles'

interface SchemaFormProps {
  schema: any
  value: any
  onChange: (path: string[], newValue: any) => void
  errors?: { [key: string]: string }
  path?: string[]
  definitions?: Record<string, any>
  dependencies?: {
    [key: string]: {
      field: string
      mapping: {
        [key: string]: string[]
      }
    }
  }
}

interface FieldProps extends SchemaFormProps {
  required?: boolean
}

interface SelectOption {
  label: string
  value: string
}

const resolveRef = (ref: string, definitions: Record<string, any>) => {
  const path = ref.replace('#/$defs/', '').split('/')
  return path.reduce((obj, key) => obj?.[key], definitions)
}

const SchemaField = ({ schema, value, onChange, path = [], definitions = {}, required, errors = {} }: FieldProps) => {
  const fieldName = path[path.length - 1]
  if (!fieldName) return null; // 如果没有字段名，不渲染

  const description = schema.description?.[window.localStorage.getItem('language') || 'en'] || schema.description
  const errorText = errors[fieldName]

  // Handle $ref
  if (schema.$ref && definitions) {
    const resolvedSchema = resolveRef(schema.$ref, definitions)
    return (
      <SchemaForm
        schema={resolvedSchema}
        value={value}
        onChange={onChange}
        path={path}
        definitions={definitions}
        errors={errors}
      />
    )
  }

  // Handle anyOf
  if (schema.anyOf) {
    // For now, we'll just use the first non-null schema
    const nonNullSchema = schema.anyOf.find((s: any) => s.type !== 'null')
    if (nonNullSchema) {
      return (
        <SchemaField
          schema={nonNullSchema}
          value={value}
          onChange={onChange}
          path={path}
          definitions={definitions}
          required={required}
          errors={errors}
        />
      )
    }
    return null
  }

  // Handle object type
  if (schema.type === 'object' && schema.properties) {
    return (
      <SchemaForm
        schema={schema}
        value={value || {}}
        onChange={onChange}
        path={path}
        definitions={definitions}
        errors={errors}
      />
    )
  }

  // Handle enum type
  if (schema.enum) {
    const options = createListCollection<SelectOption>({
      items: schema.enum.map((value: string) => ({
        label: value,
        value: value
      }))
    })

    const defaultValue = schema.default || schema.enum[0] || ''
    const currentValue = value ?? defaultValue

    return (
      <Field 
        required={required}
        orientation="horizontal"
        label={schema.title || fieldName}
        errorText={errorText}
        invalid={!!errorText}
      >
        <SelectRoot
          value={[currentValue]}
          onValueChange={({ value }) => onChange(path, value[0] || defaultValue)}
          {...settingStyles.general.select.root}
          collection={options}
        >
          <SelectTrigger {...settingStyles.general.select.trigger}>
            <SelectValueText placeholder={description || 'Select option'} />
          </SelectTrigger>
          <SelectContent>
            {options.items.map((option: SelectOption) => (
              <SelectItem key={option.value} item={option}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </Field>
    )
  }

  // Handle boolean type
  if (schema.type === 'boolean') {
    const defaultValue = schema.default ?? false
    const currentValue = value ?? defaultValue

    return (
      <Field 
        {...settingStyles.live2d.field}
        label={schema.title || fieldName}
        errorText={errorText}
        invalid={!!errorText}
      >
        <Switch
          {...settingStyles.live2d.switch}
          checked={currentValue}
          onCheckedChange={({ checked }) => onChange(path, checked)}
        />
      </Field>
    )
  }

  // Handle number type
  if (schema.type === 'integer' || schema.type === 'number') {
    const defaultValue = schema.default ?? ''
    const currentValue = value ?? defaultValue

    return (
      <Field
        orientation="horizontal"
        label={schema.title || fieldName}
        required={required}
        errorText={errorText}
        invalid={!!errorText}
      >
        <NumberInputRoot
          flex={1}
          min={schema.minimum}
          max={schema.maximum}
          value={currentValue.toString()}
          onValueChange={(e) => onChange(path, e.value === '' ? null : Number(e.value))}
        >
          <NumberInputField {...settingStyles.live2d.numberInput.input} />
        </NumberInputRoot>
      </Field>
    )
  }

  // Handle string type
  if (schema.type === 'string') {
    const defaultValue = schema.default ?? ''
    const currentValue = value ?? defaultValue

    return (
      <Field
        orientation="horizontal"
        label={schema.title || fieldName}
        required={required}
        errorText={errorText}
        invalid={!!errorText}
      >
        <Input
          flex={1}
          value={currentValue}
          onChange={(e) => onChange(path, e.target.value || null)}
          placeholder={description}
          bg="whiteAlpha.100"
          borderColor="whiteAlpha.200"
          _hover={{ bg: "whiteAlpha.200" }}
        />
      </Field>
    )
  }

  return null
}

export const SchemaForm = ({ schema, value, onChange, path = [], definitions, dependencies, errors = {} }: SchemaFormProps) => {
  const fields = useMemo(() => {
    if (!schema?.properties) return []

    return Object.entries(schema.properties).map(([key, fieldSchema]: [string, any]) => {
      const currentPath = [...path, key]
      const currentValue = value?.[key]
      const isRequired = schema.required?.includes(key)

      if (dependencies) {
        const isDependencyField = Object.values(dependencies).some(
          dep => dep.field === key
        )

        if (isDependencyField) {
          return (
            <SchemaField
              key={key}
              schema={fieldSchema}
              value={currentValue}
              onChange={onChange}
              path={currentPath}
              required={isRequired}
              definitions={definitions}
              errors={errors}
            />
          )
        }

        for (const [_, dep] of Object.entries(dependencies)) {
          const depValue = value?.[dep.field]
          const visibleFields = dep.mapping[depValue] || []
          if (visibleFields.includes(key)) {
            return (
              <SchemaField
                key={key}
                schema={fieldSchema}
                value={currentValue}
                onChange={onChange}
                path={currentPath}
                required={isRequired}
                definitions={definitions}
                errors={errors}
              />
            )
          }
        }

        if (Object.values(dependencies).some(dep => 
          Object.values(dep.mapping).some(fields => fields.includes(key))
        )) {
          return null
        }
      }

      return (
        <SchemaField
          key={key}
          schema={fieldSchema}
          value={currentValue}
          onChange={onChange}
          path={currentPath}
          required={isRequired}
          definitions={definitions}
          errors={errors}
        />
      )
    })
  }, [schema, value, onChange, path, definitions, dependencies, errors])

  return (
    <Stack 
      gap={8}
      maxW="sm"
      css={{ "--field-label-width": "120px" }}
    >
      {fields}
    </Stack>
  )
} 
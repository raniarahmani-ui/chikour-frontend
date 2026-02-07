<?php
/**
 * Input Validator Helper
 * Validates and sanitizes input data
 */

class Validator {
    private $errors = [];
    private $data = [];
    
    public function __construct($data) {
        $this->data = $data;
    }
    
    /**
     * Check if field is required
     */
    public function required($field, $message = null) {
        if (!isset($this->data[$field]) || trim($this->data[$field]) === '') {
            $this->errors[$field] = $message ?? "{$field} is required";
        }
        return $this;
    }
    
    /**
     * Validate email format
     */
    public function email($field, $message = null) {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = $message ?? "Invalid email format";
        }
        return $this;
    }
    
    /**
     * Validate minimum length
     */
    public function minLength($field, $length, $message = null) {
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $length) {
            $this->errors[$field] = $message ?? "{$field} must be at least {$length} characters";
        }
        return $this;
    }
    
    /**
     * Validate maximum length
     */
    public function maxLength($field, $length, $message = null) {
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $length) {
            $this->errors[$field] = $message ?? "{$field} must not exceed {$length} characters";
        }
        return $this;
    }
    
    /**
     * Validate numeric value
     */
    public function numeric($field, $message = null) {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = $message ?? "{$field} must be a number";
        }
        return $this;
    }
    
    /**
     * Validate integer value
     */
    public function integer($field, $message = null) {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_INT)) {
            $this->errors[$field] = $message ?? "{$field} must be an integer";
        }
        return $this;
    }
    
    /**
     * Validate value is in array
     */
    public function inArray($field, $allowed, $message = null) {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $allowed)) {
            $this->errors[$field] = $message ?? "{$field} must be one of: " . implode(', ', $allowed);
        }
        return $this;
    }
    
    /**
     * Alias for inArray - Validate value is in allowed list
     */
    public function in($field, $allowed, $message = null) {
        return $this->inArray($field, $allowed, $message);
    }
    
    /**
     * Validate minimum value
     */
    public function min($field, $value, $message = null) {
        if (isset($this->data[$field]) && $this->data[$field] < $value) {
            $this->errors[$field] = $message ?? "{$field} must be at least {$value}";
        }
        return $this;
    }
    
    /**
     * Validate maximum value
     */
    public function max($field, $value, $message = null) {
        if (isset($this->data[$field]) && $this->data[$field] > $value) {
            $this->errors[$field] = $message ?? "{$field} must not exceed {$value}";
        }
        return $this;
    }
    
    /**
     * Validate date format
     */
    public function date($field, $format = 'Y-m-d', $message = null) {
        if (isset($this->data[$field])) {
            $d = DateTime::createFromFormat($format, $this->data[$field]);
            if (!$d || $d->format($format) !== $this->data[$field]) {
                $this->errors[$field] = $message ?? "Invalid date format for {$field}";
            }
        }
        return $this;
    }
    
    /**
     * Custom validation with callback
     */
    public function custom($field, $callback, $message) {
        if (isset($this->data[$field]) && !$callback($this->data[$field])) {
            $this->errors[$field] = $message;
        }
        return $this;
    }
    
    /**
     * Check if validation passed
     */
    public function passes() {
        return empty($this->errors);
    }
    
    /**
     * Check if validation failed
     */
    public function fails() {
        return !empty($this->errors);
    }
    
    /**
     * Get validation errors
     */
    public function getErrors() {
        return $this->errors;
    }
    
    /**
     * Sanitize string input
     */
    public static function sanitizeString($value) {
        return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Sanitize integer input
     */
    public static function sanitizeInt($value) {
        return filter_var($value, FILTER_SANITIZE_NUMBER_INT);
    }
    
    /**
     * Sanitize email input
     */
    public static function sanitizeEmail($value) {
        return filter_var(trim($value), FILTER_SANITIZE_EMAIL);
    }
}
